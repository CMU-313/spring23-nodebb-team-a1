"use strict";
// This is one of the two example TypeScript files included with the NodeBB repository
// It is meant to serve as an example to assist you with your HW1 translation
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setActivePostSharingNetworks = exports.getActivePostSharing = exports.getPostSharing = void 0;
const lodash_1 = __importDefault(require("lodash"));
const plugins_1 = __importDefault(require("./plugins"));
const database_1 = __importDefault(require("./database"));
let postSharing = null;
function getPostSharing() {
    return __awaiter(this, void 0, void 0, function* () {
        if (postSharing) {
            return lodash_1.default.cloneDeep(postSharing);
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
        networks = (yield plugins_1.default.hooks.fire('filter:social.posts', networks));
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const activated = yield database_1.default.getSetMembers('social:posts.activated');
        networks.forEach((network) => {
            network.activated = activated.includes(network.id);
        });
        postSharing = networks;
        return lodash_1.default.cloneDeep(networks);
    });
}
exports.getPostSharing = getPostSharing;
function getActivePostSharing() {
    return __awaiter(this, void 0, void 0, function* () {
        const networks = yield getPostSharing();
        return networks.filter(network => network && network.activated);
    });
}
exports.getActivePostSharing = getActivePostSharing;
function setActivePostSharingNetworks(networkIDs) {
    return __awaiter(this, void 0, void 0, function* () {
        postSharing = null;
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield database_1.default.delete('social:posts.activated');
        if (!networkIDs.length) {
            return;
        }
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        yield database_1.default.setAdd('social:posts.activated', networkIDs);
    });
}
exports.setActivePostSharingNetworks = setActivePostSharingNetworks;
