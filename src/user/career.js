'use strict';

const db = require('../database');
const plugins = require('../plugins');

module.exports = function (User) {
    User.getCareerData = async function (uid) {
        uid = isNaN(uid) ? 0 : parseInt(uid, 10);
        const careerData = await db.getObject(`user:${uid}:career`);
        return careerData;
    };

    User.getAllCareerData = async function () {
        const uids = await db.getSortedSetRange('users:career', 0, -1);
        const allData = await db.getObjects(uids.map(uid => `user:${uid}:career`));
        return allData;
    };

    User.setCareerData = async function (uid, data) {
        await db.setObject(`user:${uid}:career`, data);
        for (const [field, value] of Object.entries(data)) {
            plugins.hooks.fire('action:user.set', { uid, field, value, type: 'set' });
        }
    };
};
