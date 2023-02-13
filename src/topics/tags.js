"use strict";
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
const validator_1 = __importDefault(require("validator"));
const lodash_1 = __importDefault(require("lodash"));
const database_1 = __importDefault(require("../database"));
const meta_1 = __importDefault(require("../meta"));
const user_1 = __importDefault(require("../user"));
const categories_1 = __importDefault(require("../categories"));
const plugins_1 = __importDefault(require("../plugins"));
const utils_1 = __importDefault(require("../utils"));
const batch_1 = __importDefault(require("../batch"));
const cache_1 = __importDefault(require("../cache"));
module.exports = function (Topics) {
    function updateTagCount(tag) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield Topics.getTagTopicCount(tag);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield database_1.default.sortedSetAdd('tags:topic:count', count || 0, tag);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            cache_1.default.del('tags:topic:count');
        });
    }
    function getAllTags() {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const cached = cache_1.default.get('tags:topic:count');
            if (cached !== undefined) {
                return cached;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const tags = yield database_1.default.getSortedSetRevRangeWithScores('tags:topic:count', 0, -1);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            cache_1.default.set('tags:topic:count', tags);
            return tags;
        });
    }
    function filterCategoryTags(tags, cid) {
        return __awaiter(this, void 0, void 0, function* () {
            const tagWhitelist = yield categories_1.default.getTagWhitelist([cid]);
            if (!Array.isArray(tagWhitelist[0]) || !tagWhitelist[0].length) {
                return tags;
            }
            const whitelistSet = new Set(tagWhitelist[0]);
            return tags.filter(tag => whitelistSet.has(tag));
        });
    }
    function renameTag(tag, newTagName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!newTagName || tag === newTagName) {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            newTagName = utils_1.default.cleanUpTag(newTagName, meta_1.default.config.maximumTagLength);
            yield Topics.createEmptyTag(newTagName);
            const allCids = {};
            yield batch_1.default.processSortedSet(`tag:${tag}:topics`, (tids) => __awaiter(this, void 0, void 0, function* () {
                const topicData = yield Topics.getTopicsFields(tids, ['tid', 'cid', 'tags']);
                const cids = topicData.map(t => t.cid);
                topicData.forEach((t) => { allCids[t.cid] = true; });
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                const scores = yield database_1.default.sortedSetScores(`tag:${tag}:topics`, tids);
                // update tag:<tag>:topics
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                yield database_1.default.sortedSetAdd(`tag:${newTagName}:topics`, scores, tids);
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                yield database_1.default.sortedSetRemove(`tag:${tag}:topics`, tids);
                // update cid:<cid>:tag:<tag>:topics
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                yield database_1.default.sortedSetAddBulk(topicData.map((t, index) => [`cid:${t.cid}:tag:${newTagName}:topics`, scores[index], t.tid]));
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                yield database_1.default.sortedSetRemove(cids.map(cid => `cid:${cid}:tag:${tag}:topics`), tids);
                // update 'tags' field in topic hash
                topicData.forEach((topic) => {
                    topic.tags = topic.tags.map(tagItem => tagItem.value);
                    const index = topic.tags.indexOf(tag);
                    if (index !== -1) {
                        topic.tags.splice(index, 1, newTagName);
                    }
                });
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                yield database_1.default.setObjectBulk(topicData.map(t => [`topic:${t.tid}`, { tags: t.tags.join(',') }]));
            }), {});
            yield Topics.deleteTag(tag);
            yield updateTagCount(newTagName);
            yield Topics.updateCategoryTagsCount(Object.keys(allCids), [newTagName]);
        });
    }
    function removeTagsFromTopics(tags) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(tags.map((tag) => __awaiter(this, void 0, void 0, function* () {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                const tids = yield database_1.default.getSortedSetRange(`tag:${tag}:topics`, 0, -1);
                if (!tids.length) {
                    return;
                }
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                yield database_1.default.deleteObjectFields(tids.map(tid => `topic:${tid}`), ['tags']);
            })));
        });
    }
    function getFromSet(set, start, stop) {
        return __awaiter(this, void 0, void 0, function* () {
            let tags;
            if (Array.isArray(set)) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tags = (yield database_1.default.getSortedSetRevUnion({
                    sets: set,
                    start,
                    stop,
                    withScores: true,
                }));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tags = (yield database_1.default.getSortedSetRevRangeWithScores(set, start, stop));
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const payload = yield plugins_1.default.hooks.fire('filter:tags.getAll', {
                tags: tags,
            });
            return Topics.getTagData(payload.tags);
        });
    }
    function findMatches(data) {
        return __awaiter(this, void 0, void 0, function* () {
            let { query } = data;
            let tagWhitelist = [];
            if (parseInt(data.cid, 10)) {
                tagWhitelist = (yield categories_1.default.getTagWhitelist([data.cid]));
            }
            let tags = [];
            if (Array.isArray(tagWhitelist[0]) && tagWhitelist[0].length) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                const scores = yield database_1.default.sortedSetScores(`cid:${data.cid}:tags`, tagWhitelist[0]);
                tags = tagWhitelist[0].map((tag, index) => ({ value: tag, score: scores[index] }));
            }
            else if (data.cids) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                tags = (yield database_1.default.getSortedSetRevUnion({
                    sets: data.cids.map(cid => `cid:${cid}:tags`),
                    start: 0,
                    stop: -1,
                    withScores: true,
                }));
            }
            else {
                tags = (yield getAllTags());
            }
            query = query.toLowerCase();
            const matches = [];
            for (let i = 0; i < tags.length; i += 1) {
                if (tags[i].value && tags[i].value.toLowerCase().startsWith(query)) {
                    matches.push(tags[i]);
                    if (matches.length > 39) {
                        break;
                    }
                }
            }
            matches.sort((a, b) => {
                if (a < b) {
                    return -1;
                }
                else if (a > b) {
                    return 1;
                }
                return 0;
            });
            return { matches: matches };
        });
    }
    Topics.createTags = function (tags, tid, timestamp) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Array.isArray(tags) || !tags.length) {
                return;
            }
            const cid = yield Topics.getTopicField(tid, 'cid');
            const topicSets = tags.map(tag => `tag:${tag}:topics`).concat(tags.map(tag => `cid:${cid}:tag:${tag}:topics`));
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield database_1.default.sortedSetsAdd(topicSets, timestamp, tid);
            yield Topics.updateCategoryTagsCount([cid], tags);
            yield Promise.all(tags.map(updateTagCount));
        });
    };
    Topics.filterTags = function (tags, cid) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const result = yield plugins_1.default.hooks.fire('filter:tags.filter', { tags: tags, cid: cid });
            tags = lodash_1.default.uniq(result.tags)
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                .map(tag => utils_1.default.cleanUpTag(tag, meta_1.default.config.maximumTagLength))
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                .filter(tag => tag && tag.length >= (meta_1.default.config.minimumTagLength || 3));
            return yield filterCategoryTags(tags, cid);
        });
    };
    Topics.updateCategoryTagsCount = function (cids, tags) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Promise.all(cids.map((cid) => __awaiter(this, void 0, void 0, function* () {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                const counts = yield database_1.default.sortedSetsCard(tags.map(tag => `cid:${cid}:tag:${tag}:topics`));
                const tagToCount = lodash_1.default.zipObject(tags, counts);
                const set = `cid:${cid}:tags`;
                const bulkAdd = tags.filter(tag => tagToCount[tag] > 0)
                    .map(tag => [set, tagToCount[tag], tag]);
                const bulkRemove = tags.filter(tag => tagToCount[tag] <= 0)
                    .map(tag => [set, tag]);
                yield Promise.all([
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
                    database_1.default.sortedSetAddBulk(bulkAdd),
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
                    database_1.default.sortedSetRemoveBulk(bulkRemove),
                ]);
            })));
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
            yield database_1.default.sortedSetsRemoveRangeByScore(cids.map(cid => `cid:${cid}:tags`), '-inf', 0);
        });
    };
    Topics.validateTags = function (tags, cid, uid, tid = null) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Array.isArray(tags)) {
                throw new Error('[[error:invalid-data]]');
            }
            tags = lodash_1.default.uniq(tags);
            const [categoryData, isPrivileged, currentTags] = yield Promise.all([
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                categories_1.default.getCategoryFields(cid, ['minTags', 'maxTags']),
                user_1.default.isPrivileged(uid),
                tid ? Topics.getTopicTags(tid) : [],
            ]);
            if (tags.length < parseInt(categoryData.minTags, 10)) {
                throw new Error(`[[error:not-enough-tags, ${categoryData.minTags}]]`);
            }
            else if (tags.length > parseInt(categoryData.maxTags, 10)) {
                throw new Error(`[[error:too-many-tags, ${categoryData.maxTags}]]`);
            }
            const addedTags = tags.filter(tag => !currentTags.includes(tag));
            const removedTags = currentTags.filter(tag => !tags.includes(tag));
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const systemTags = (meta_1.default.config.systemTags || '').split(',');
            if (!isPrivileged && systemTags.length &&
                addedTags.length && addedTags.some(tag => systemTags.includes(tag))) {
                throw new Error('[[error:cant-use-system-tag]]');
            }
            if (!isPrivileged && systemTags.length &&
                removedTags.length && removedTags.some(tag => systemTags.includes(tag))) {
                throw new Error('[[error:cant-remove-system-tag]]');
            }
        });
    };
    Topics.createEmptyTag = function (tag) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!tag) {
                throw new Error('[[error:invalid-tag]]');
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            if (tag.length < (meta_1.default.config.minimumTagLength || 3)) {
                throw new Error('[[error:tag-too-short]]');
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const isMember = yield database_1.default.isSortedSetMember('tags:topic:count', tag);
            if (!isMember) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                yield database_1.default.sortedSetAdd('tags:topic:count', 0, tag);
                cache_1.default.del('tags:topic:count');
            }
            const allCids = yield categories_1.default.getAllCidsFromSet('categories:cid');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const isMembers = yield database_1.default.isMemberOfSortedSets(allCids.map(cid => `cid:${cid}:tags`), tag);
            const bulkAdd = allCids.filter((cid, index) => !isMembers[index])
                .map(cid => ([`cid:${cid}:tags`, 0, tag]));
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield database_1.default.sortedSetAddBulk(bulkAdd);
        });
    };
    Topics.renameTags = function (data) {
        return __awaiter(this, void 0, void 0, function* () {
            for (const tagData of data) {
                // eslint-disable-next-line no-await-in-loop
                yield renameTag(tagData.value, tagData.newName);
            }
        });
    };
    Topics.getTagTids = function (tag, start, stop) {
        return __awaiter(this, void 0, void 0, function* () {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const tids = yield database_1.default.getSortedSetRevRange(`tag:${tag}:topics`, start, stop);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const payload = yield plugins_1.default.hooks.fire('filter:topics.getTagTids', { tag, start, stop, tids });
            return payload.tids;
        });
    };
    Topics.getTagTidsByCids = function (tag, cids, start, stop) {
        return __awaiter(this, void 0, void 0, function* () {
            const keys = cids.map(cid => `cid:${cid}:tag:${tag}:topics`);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const tids = yield database_1.default.getSortedSetRevRange(keys, start, stop);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const payload = yield plugins_1.default.hooks.fire('filter:topics.getTagTidsByCids', { tag, cids, start, stop, tids });
            return payload.tids;
        });
    };
    Topics.getTagTopicCount = function (tag, cids = []) {
        return __awaiter(this, void 0, void 0, function* () {
            let count = 0;
            if (cids.length) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                count = (yield database_1.default.sortedSetsCardSum(cids.map(cid => `cid:${cid}:tag:${tag}:topics`)));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                count = (yield database_1.default.sortedSetCard(`tag:${tag}:topics`));
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const payload = yield plugins_1.default.hooks.fire('filter:topics.getTagTopicCount', { tag, count, cids });
            return payload.count;
        });
    };
    Topics.deleteTags = function (tags) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!Array.isArray(tags) || !tags.length) {
                return;
            }
            yield removeTagsFromTopics(tags);
            const keys = tags.map(tag => `tag:${tag}:topics`);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield database_1.default.deleteAll(keys);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield database_1.default.sortedSetRemove('tags:topic:count', tags);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            cache_1.default.del('tags:topic:count');
            const cids = yield categories_1.default.getAllCidsFromSet('categories:cid');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield database_1.default.sortedSetRemove(cids.map(cid => `cid:${cid}:tags`), tags);
            const deleteKeys = [];
            tags.forEach((tag) => {
                deleteKeys.push(`tag:${tag}`);
                cids.forEach((cid) => {
                    deleteKeys.push(`cid:${cid}:tag:${tag}:topics`);
                });
            });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield database_1.default.deleteAll(deleteKeys);
        });
    };
    Topics.deleteTag = function (tag) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Topics.deleteTags([tag]);
        });
    };
    Topics.getTags = function (start, stop) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield getFromSet('tags:topic:count', start, stop);
        });
    };
    Topics.getCategoryTags = function (cids, start, stop) {
        return __awaiter(this, void 0, void 0, function* () {
            if (Array.isArray(cids)) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                return yield database_1.default.getSortedSetRevUnion({
                    sets: cids.map(cid => `cid:${cid}:tags`),
                    start,
                    stop,
                });
            }
        });
    };
    Topics.getCategoryTagsData = function (cids, start, stop) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield getFromSet(Array.isArray(cids) ? cids.map(cid => `cid:${cid}:tags`) : `cid`, start, stop);
        });
    };
    Topics.getTagData = function (tags) {
        if (!tags.length) {
            return [];
        }
        tags.forEach((tag) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            tag.valueEscaped = validator_1.default.escape(String(tag.value));
            tag.valueEncoded = encodeURIComponent(tag.valueEscaped);
            tag.class = tag.valueEscaped.replace(/\s/g, '-');
        });
        return tags;
    };
    Topics.getTopicTags = function (tid) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield Topics.getTopicsTags([tid]);
            return data && data[0];
        });
    };
    Topics.getTopicsTags = function (tids) {
        return __awaiter(this, void 0, void 0, function* () {
            const topicTagData = yield Topics.getTopicsFields(tids, ['tags']);
            return tids.map((tid, i) => topicTagData[i].tags.map(tagData => tagData.value));
        });
    };
    Topics.getTopicTagsObjects = function (tid) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = yield Topics.getTopicsTagsObjects([tid]);
            return Array.isArray(data) && data.length ? data[0] : [];
        });
    };
    Topics.getTopicsTagsObjects = function (tids) {
        return __awaiter(this, void 0, void 0, function* () {
            const topicTags = yield Topics.getTopicsTags(tids);
            const uniqueTopicTags = lodash_1.default.uniq(lodash_1.default.flatten(topicTags));
            const tags = uniqueTopicTags.map(tag => ({ value: tag }));
            const tagData = Topics.getTagData(tags);
            const tagDataMap = lodash_1.default.zipObject(uniqueTopicTags, tagData);
            topicTags.forEach((tags, index) => {
                if (Array.isArray(tags)) {
                    topicTags[index] = tags.map(tag => tagDataMap[tag]);
                }
            });
            return topicTags;
        });
    };
    Topics.addTags = function (tags, tids) {
        return __awaiter(this, void 0, void 0, function* () {
            const topicData = yield Topics.getTopicsFields(tids, ['tid', 'cid', 'timestamp', 'tags']);
            const bulkAdd = [];
            const bulkSet = [];
            topicData.forEach((t) => {
                const topicTags = t.tags.map(tagItem => tagItem.value);
                tags.forEach((tag) => {
                    bulkAdd.push([`tag:${tag}:topics`, t.timestamp, t.tid]);
                    bulkAdd.push([`cid:${t.cid}:tag:${tag}:topics`, t.timestamp, t.tid]);
                    if (!topicTags.includes(tag)) {
                        topicTags.push(tag);
                    }
                });
                bulkSet.push([`topic:${t.tid}`, { tags: topicTags.join(',') }]);
            });
            yield Promise.all([
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                database_1.default.sortedSetAddBulk(bulkAdd),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                database_1.default.setObjectBulk(bulkSet),
            ]);
            yield Promise.all(tags.map(updateTagCount));
            yield Topics.updateCategoryTagsCount(lodash_1.default.uniq(topicData.map(t => t.cid)), tags);
        });
    };
    Topics.removeTags = function (tags, tids) {
        return __awaiter(this, void 0, void 0, function* () {
            const topicData = yield Topics.getTopicsFields(tids, ['tid', 'cid', 'tags']);
            const bulkRemove = [];
            const bulkSet = [];
            topicData.forEach((t) => {
                const topicTags = t.tags.map(tagItem => tagItem.value);
                tags.forEach((tag) => {
                    bulkRemove.push([`tag:${tag}:topics`, t.tid]);
                    bulkRemove.push([`cid:${t.cid}:tag:${tag}:topics`, t.tid]);
                    if (topicTags.includes(tag)) {
                        topicTags.splice(topicTags.indexOf(tag), 1);
                    }
                });
                bulkSet.push([`topic:${t.tid}`, { tags: topicTags.join(',') }]);
            });
            yield Promise.all([
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                database_1.default.sortedSetRemoveBulk(bulkRemove),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                database_1.default.setObjectBulk(bulkSet),
            ]);
            yield Promise.all(tags.map(updateTagCount));
            yield Topics.updateCategoryTagsCount(lodash_1.default.uniq(topicData.map(t => t.cid)), tags);
        });
    };
    Topics.updateTopicTags = function (tid, tags) {
        return __awaiter(this, void 0, void 0, function* () {
            yield Topics.deleteTopicTags(tid);
            const cid = yield Topics.getTopicField(tid, 'cid');
            tags = yield Topics.filterTags(tags, cid);
            yield Topics.addTags(tags, [tid]);
        });
    };
    Topics.deleteTopicTags = function (tid) {
        return __awaiter(this, void 0, void 0, function* () {
            const topicData = yield Topics.getTopicFields(tid, ['cid', 'tags']);
            const { cid } = topicData;
            const tags = topicData.tags2.map(tagItem => tagItem.value);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield database_1.default.deleteObjectField(`topic:${tid}`, 'tags');
            const sets = tags.map(tag => `tag:${tag}:topics`)
                .concat(tags.map(tag => `cid:${cid}:tag:${tag}:topics`));
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            yield database_1.default.sortedSetsRemove(sets, tid);
            yield Topics.updateCategoryTagsCount([cid], tags);
            yield Promise.all(tags.map(updateTagCount));
        });
    };
    Topics.searchTags = function (data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!data || !data.query) {
                return [];
            }
            let result;
            if (plugins_1.default.hooks.hasListeners('filter:topics.searchTags')) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                result = (yield plugins_1.default.hooks.fire('filter:topics.searchTags', { data: data }));
            }
            else {
                result = yield findMatches(data);
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            result = (yield plugins_1.default.hooks.fire('filter:tags.search', { data: data, matches: result.matches }));
            return result.matches;
        });
    };
    Topics.autocompleteTags = function (data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!data || !data.query) {
                return [];
            }
            let result;
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            if (plugins_1.default.hooks.hasListeners('filter:topics.autocompleteTags')) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                result = (yield plugins_1.default.hooks.fire('filter:topics.autocompleteTags', { data: data }));
            }
            else {
                result = yield findMatches(data);
            }
            return result.matches;
        });
    };
    Topics.searchAndLoadTags = function (data) {
        return __awaiter(this, void 0, void 0, function* () {
            const searchResult = {
                tags: [],
                matchCount: 0,
                pageCount: 1,
            };
            if (!data || !data.query || !data.query.length) {
                return searchResult;
            }
            const tags = yield Topics.searchTags(data);
            const tagData = Topics.getTagData(tags.map(tag => ({ value: tag.value })));
            tagData.forEach((tag, index) => {
                tag.score = tags[index].score;
            });
            tagData.sort((a, b) => b.score - a.score);
            searchResult.tags = tagData;
            searchResult.matchCount = tagData.length;
            searchResult.pageCount = 1;
            return searchResult;
        });
    };
    Topics.getRelatedTopics = function (topicData, uid) {
        return __awaiter(this, void 0, void 0, function* () {
            if (plugins_1.default.hooks.hasListeners('filter:topic.getRelatedTopics')) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
                const result = yield plugins_1.default.hooks.fire('filter:topic.getRelatedTopics', { topic: topicData, uid: uid, topics: [] });
                return result.topics;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            let maximumTopics = meta_1.default.config.maximumRelatedTopics;
            if (maximumTopics === 0 || !topicData.tags || !topicData.tags.length) {
                return [];
            }
            maximumTopics = maximumTopics || 5;
            let tids = yield Promise.all(topicData.tags2.map(tag => Topics.getTagTids(tag.value, 0, 5)));
            tids = lodash_1.default.shuffle(lodash_1.default.uniq(lodash_1.default.flatten(tids))).slice(0, maximumTopics);
            const topics = yield Topics.getTopics(tids, uid);
            return topics.filter(t => t && !t.deleted && parseInt(t.uid, 10) !== parseInt(uid, 10));
        });
    };
};
