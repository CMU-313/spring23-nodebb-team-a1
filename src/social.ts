import * as _ from 'lodash';
import * as plugins from './plugins';
import * as db from './database';

export const social = {
    postSharing: null,

    async getPostSharing(): Promise<Array<{ id: string; name: string; class: string; activated: boolean }>> {
        if (social.postSharing) {
            return _.cloneDeep(social.postSharing);
        }

        let networks = [
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
        networks = await plugins.hooks.fire('filter:social.posts', networks);
        const activated = await db.getSetMembers('social:posts.activated');
        networks.forEach((network) => {
            network.activated = activated.includes(network.id);
        });

        social.postSharing = networks;
        return _.cloneDeep(networks);
    },

    async getActivePostSharing(): Promise<Array<{ id: string; name: string; class: string; activated: boolean }>> {
        const networks = await social.getPostSharing();
        return networks.filter(network => network && network.activated);
    },

    async setActivePostSharingNetworks(networkIDs: string[]): Promise<void> {
        social.postSharing = null;
        await db.delete('social:posts.activated');
        if (!networkIDs.length) {
            return;
        }
        await db.setAdd('social:posts.activated', networkIDs);
    },
};
