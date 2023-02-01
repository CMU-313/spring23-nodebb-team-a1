'use strict';

const assert = require('assert');
const nconf = require('nconf');
const util = require('util');

const db = require('../mocks/databasemock');

const helpers = require('../helpers');

const meta = require('../../src/meta');
const user = require('../../src/user');
const groups = require('../../src/groups');
const plugins = require('../../src/plugins');
const utils = require('../../src/utils');

describe('email confirmation (library methods)', () => {
    let uid;
    async function dummyEmailerHook(data) {
        // pretend to handle sending emails
    }

    before(() => {
        // Attach an emailer hook so related requests do not error
        plugins.hooks.register('emailer-test', {
            hook: 'filter:email.send',
            method: dummyEmailerHook,
        });
    });

    beforeEach(async () => {
        uid = await user.create({
            username: utils.generateUUID().slice(0, 10),
            password: utils.generateUUID(),
        });
    });

    after(async () => {
        plugins.hooks.unregister('emailer-test', 'filter:email.send');
    });

    describe('isValidationPending', () => {
        it('should return false if user did not request email validation', async () => {
            const pending = await user.email.isValidationPending(uid);

            assert.strictEqual(pending, false);
        });

        it('should return false if user did not request email validation (w/ email checking)', async () => {
            const email = 'test@example.org';
            const pending = await user.email.isValidationPending(uid, email);

            assert.strictEqual(pending, false);
        });

        it('should return true if user requested email validation', async () => {
            const email = 'test@example.org';
            await user.email.sendValidationEmail(uid, {
                email,
            });
            const pending = await user.email.isValidationPending(uid);

            assert.strictEqual(pending, true);
        });

        it('should return true if user requested email validation (w/ email checking)', async () => {
            const email = 'test@example.org';
            await user.email.sendValidationEmail(uid, {
                email,
            });
            const pending = await user.email.isValidationPending(uid, email);

            assert.strictEqual(pending, true);
        });
    });

    describe('getValidationExpiry', () => {
        it('should return null if there is no validation available', async () => {
            const expiry = await user.email.getValidationExpiry(uid);

            assert.strictEqual(expiry, null);
        });

        it('should return a number smaller than configured expiry if validation available', async () => {
            const email = 'test@example.org';
            await user.email.sendValidationEmail(uid, {
                email,
            });
            const expiry = await user.email.getValidationExpiry(uid);

            assert(isFinite(expiry));
            assert(expiry > 0);
            assert(expiry <= meta.config.emailConfirmExpiry * 24 * 60 * 60 * 1000);
        });
    });

    describe('expireValidation', () => {
        it('should invalidate any confirmation in-progress', async () => {
            const email = 'test@example.org';
            await user.email.sendValidationEmail(uid, {
                email,
            });
            await user.email.expireValidation(uid);

            assert.strictEqual(await user.email.isValidationPending(uid), false);
            assert.strictEqual(await user.email.isValidationPending(uid, email), false);
            assert.strictEqual(await user.email.canSendValidation(uid, email), true);
        });
    });

    describe('canSendValidation', () => {
        it('should return true if no validation is pending', async () => {
            const ok = await user.email.canSendValidation(uid, 'test@example.com');

            assert(ok);
        });

        it('should return false if it has been too soon to re-send confirmation', async () => {
            const email = 'test@example.org';
            await user.email.sendValidationEmail(uid, {
                email,
            });
            const ok = await user.email.canSendValidation(uid, 'test@example.com');

            assert.strictEqual(ok, false);
        });

        it('should return true if it has been long enough to re-send confirmation', async () => {
            const email = 'test@example.org';
            await user.email.sendValidationEmail(uid, {
                email,
            });
            await db.pexpire(`confirm:byUid:${uid}`, 1000);
            const ok = await user.email.canSendValidation(uid, 'test@example.com');

            assert(ok);
        });
    });
});

describe('email confirmation (v3 api)', () => {
    let userObj;
    let jar;
    const register = data => new Promise((resolve, reject) => {
        helpers.registerUser(data, (err, jar, response, body) => {
            if (err) {
                return reject(err);
            }

            resolve({ jar, response, body });
        });
    });
    const login = util.promisify(helpers.loginUser);

    before(async () => {
        // If you're running this file directly, uncomment these lines
        await register({
            username: 'fake-user',
            password: 'derpioansdosa',
            'account-type': 'student',
            email: 'b@c.com',
            gdpr_consent: true,
        });

        ({ body: userObj, jar } = await register({
            username: 'email-test',
            password: 'abcdef',
            'account-type': 'student',
            email: 'test@example.org',
            gdpr_consent: true,
        }));
    });

    it('should have a pending validation', async () => {
        const code = await db.get(`confirm:byUid:${userObj.uid}`);
        assert.strictEqual(await user.email.isValidationPending(userObj.uid, 'test@example.org'), true);
    });

    it('should not list their email', async () => {
        const { res, body } = await helpers.request('get', `/api/v3/users/${userObj.uid}/emails`, {
            jar,
            json: true,
        });

        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(body, JSON.parse('{"status":{"code":"ok","message":"OK"},"response":{"emails":[]}}'));
    });

    it('should not allow confirmation if they are not an admin', async () => {
        const { res } = await helpers.request('post', `/api/v3/users/${userObj.uid}/emails/${encodeURIComponent('test@example.org')}/confirm`, {
            jar,
            json: true,
        });

        assert.strictEqual(res.statusCode, 403);
    });

    it('should not confirm an email that is not pending or set', async () => {
        await groups.join('administrators', userObj.uid);
        const { res, body } = await helpers.request('post', `/api/v3/users/${userObj.uid}/emails/${encodeURIComponent('fake@example.org')}/confirm`, {
            jar,
            json: true,
        });

        assert.strictEqual(res.statusCode, 404);
        await groups.leave('administrators', userObj.uid);
    });

    it('should confirm their email (using the pending validation)', async () => {
        await groups.join('administrators', userObj.uid);
        const { res, body } = await helpers.request('post', `/api/v3/users/${userObj.uid}/emails/${encodeURIComponent('test@example.org')}/confirm`, {
            jar,
            json: true,
        });

        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(body, JSON.parse('{"status":{"code":"ok","message":"OK"},"response":{}}'));
        await groups.leave('administrators', userObj.uid);
    });

    it('should still confirm the email (as email is set in user hash)', async () => {
        await user.email.remove(userObj.uid);
        await user.setUserField(userObj.uid, 'email', 'test@example.org');
        ({ jar } = await login('email-test', 'abcdef')); // email removal logs out everybody
        await groups.join('administrators', userObj.uid);

        const { res, body } = await helpers.request('post', `/api/v3/users/${userObj.uid}/emails/${encodeURIComponent('test@example.org')}/confirm`, {
            jar,
            json: true,
        });

        assert.strictEqual(res.statusCode, 200);
        assert.deepStrictEqual(body, JSON.parse('{"status":{"code":"ok","message":"OK"},"response":{}}'));
        await groups.leave('administrators', userObj.uid);
    });
});
