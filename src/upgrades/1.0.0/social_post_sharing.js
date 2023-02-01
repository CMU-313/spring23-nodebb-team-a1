'use strict';

const async = require('async');
const db = require('../../database');


module.exports = {
    name: 'Social: Post Sharing',
    timestamp: Date.UTC(2016, 1, 25),
    method: function (callback) {
        const social = require('../../social');
        async.parallel([
            async function () {
                await social.setActivePostSharingNetworks(['facebook', 'google', 'twitter']);
            },
            async function () {
                await db.deleteObjectField('config', 'disableSocialButtons');
            },
        ], callback);
    },
};
