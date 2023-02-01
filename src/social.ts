// This is one of the two example TypeScript files included with the NodeBB repository
// It is meant to serve as an example to assist you with your HW1 translation

import _ from 'lodash';
import plugins from './plugins';
import db from './database';

import { Network } from './types';

let postSharing: Network[] | null = null;

export async function getPostSharing(): Promise<Network[]> {
    if (postSharing) {
        return _.cloneDeep(postSharing);
    }

    let networks: Network[] = [
        {
            id: 'facebook',
            name: 'Facebook',
            class: 'fa-facebook',
            activated: null,
        },
        {
            id: 'twitter',
            name: 'Twitter',
            class: 'fa-twitter',
            activated: null,
        },
    ];

    networks = await plugins.hooks.fire('filter:social.posts', networks) as Network[];

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const activated: string[] = await db.getSetMembers('social:posts.activated') as string[];

    networks.forEach((network) => {
        network.activated = activated.includes(network.id);
    });

    postSharing = networks;
    return _.cloneDeep(networks);
}

export async function getActivePostSharing(): Promise<Network[]> {
    const networks: Network[] = await getPostSharing();
    return networks.filter(network => network && network.activated);
}

export async function setActivePostSharingNetworks(networkIDs: string[]): Promise<void> {
    postSharing = null;

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await db.delete('social:posts.activated');

    if (!networkIDs.length) {
        return;
    }

    // The next line calls a function in a module that has not been updated to TS yet
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await db.setAdd('social:posts.activated', networkIDs);
}
