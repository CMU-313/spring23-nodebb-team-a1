// This is one of the two example files included with the NodeBB repository
// It is the original (untranslated) JavaScript file of social.ts
// This file is meant to serve as an example to assist you with your
// HW1 translation. It is *not* meant to be run.
// You do not have to keep your original JavaScript file for this assignment

'use strict';

const _ = require('lodash');
const plugins = require('./plugins');
const db = require('./database');

const social = module.exports;

social.postSharing = null;

social.getPostSharing = async function () {
    if (social.postSharing) {
        return _.cloneDeep(social.postSharing);
    }

    let networks = [
        {
            id: 'facebook',
            name: 'Facebook',
            class: 'fa-facebook',
        },
        {
            id: 'twitter',
            name: 'Twitter',
            class: 'fa-twitter',
        },
    ];
    networks = await plugins.hooks.fire('filter:social.posts', networks);
    const activated = await db.getSetMembers('social:posts.activated');
    networks.forEach((network) => {
        network.activated = activated.includes(network.id);
    });

    social.postSharing = networks;
    return _.cloneDeep(networks);
};

social.getActivePostSharing = async function () {
    const networks = await social.getPostSharing();
    return networks.filter(network => network && network.activated);
};

social.setActivePostSharingNetworks = async function (networkIDs) {
    social.postSharing = null;
    await db.delete('social:posts.activated');
    if (!networkIDs.length) {
        return;
    }
    await db.setAdd('social:posts.activated', networkIDs);
};

require('./promisify')(social);
