// These files are not converted to TypeScript yet
/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires */
const validator = require('validator');
const _ = require('lodash');

const db = require('../database');
const meta = require('../meta');
const user = require('../user');
const categories = require('../categories');
const plugins = require('../plugins');
const utils = require('../utils');
const batch = require('../batch');
const cache = require('../cache');
/* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-var-requires */

interface TopicInfo {
    addTags: (tags: string[], tids: string[]) => Promise<void>;
    autocompleteTags: (data: Topic) => Promise<string[]>;
    createTags: (tags: string[], tid: number, timestamp: string) => Promise<void>;
    createEmptyTag: (tag: Data) => Promise<void>;
    deleteTag: (tag: string) => Promise<void>;
    deleteTags: (tags: string[]) => Promise<void>;
    deleteTopicTags: (tid: string) => Promise<void>;
    filterTags: (tags: string[], cid: TopicField) => Promise<string[]>;
    getTags: (start: number, stop: number) => Promise<string[]>;
    getTopics: (tids: TopicField[], uid: TopicField) => Promise<Topic[]>;
    getTagData: (tags: Topic[]) => string[];
    getTagTids: (tag: string, start: number, stop: number) => Promise<string[]>;
    getTopicTags: (tid: TopicField) => Promise<string[]>;
    getTopicsTags: (tags: TopicField[]) => Promise<string[][]>;
    getTopicField: (tid: TopicField, field: TopicField) => Promise<string>;
    getTopicFields: (tid: TopicField, field: (keyof Topic)[]) => Promise<Topic[]>;
    getTopicsFields: (tids: TopicField[], field: string[]) => Promise<Topic[]>;
    getCategoryTags: (cids: number[], start: number, stop: number) => Promise<string[]>;
    getTagTidsByCids: (tag: string, cids: number[], start: number, stop: number) => Promise<string[]>;
    getRelatedTopics: (topicData: Topic, uid: string) => Promise<Topic[]>;
    getTagTopicCount: (tag: string) => Promise<number>;
    getTopicTagsObjects: (tid: TopicField) => Promise<string[]>;
    getTopicsTagsObjects: (tids: TopicField[]) => Promise<string[][]>;
    getCategoryTagsData: (cids: string[], start: number, stop: number) => Promise<string[]>;
    renameTags: (data: Tag[]) => Promise<void>;
    removeTags: (tags: string[], tids: string[]) => Promise<void>;
    searchTags: (data: Topic) => Promise<string[]>;
    searchAndLoadTags: (data: Topic) => Promise<Topic>;
    updateTopicTags: (tid: string, tags: string[]) => Promise<void>;
    updateCategoryTagsCount: (cids: string[], tags: string[]) => Promise<void>;
    validateTags: (tags: string[], cid: TopicField, uid: TopicField, tid: TopicField) => Promise<void>;
}

interface Data {
    value?: Data;
    newName?: Data;
    length?: number;
    cid?: number;
}

interface Tag {
    value?: string;
    newName?: string;
}

interface Category {
    cid? : number;
    name? : string;
    minTags?: string;
    maxTags?: string;
}

interface Topic {
    tags?: Data[];
    tags2?: Tag[];
    cid?: string;
    tid?: number;
    uid?: string;
    timestamp?: number;
    query?: string;
    matches?: string[]
    value?: string;
    score?: number;
    cids?: string[];
    valueEscaped?: string;
    valueEncoded?: string;
    class?: string;
    matchCount?: number;
    pageCount?: number;
    topics?: Topic[];
    deleted?: boolean;
}

type TopicField = number | boolean | string | null | Data;

export = function (Topics: TopicInfo) {
    async function updateTagCount(tag: string) {
        const count = await Topics.getTagTopicCount(tag);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.sortedSetAdd('tags:topic:count', count || 0, tag);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        cache.del('tags:topic:count');
    }

    async function getAllTags(): Promise<string[]> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const cached = cache.get('tags:topic:count') as string[];
        if (cached !== undefined) {
            return cached;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const tags = await db.getSortedSetRevRangeWithScores('tags:topic:count', 0, -1) as string[];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        cache.set('tags:topic:count', tags);
        return tags;
    }

    async function filterCategoryTags(tags: string[], cid: TopicField): Promise<string[]> {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const tagWhitelist = await categories.getTagWhitelist([cid]) as string[];
        if (!Array.isArray(tagWhitelist[0]) || !tagWhitelist[0].length) {
            return tags;
        }
        const whitelistSet = new Set(tagWhitelist[0]);
        return tags.filter(tag => whitelistSet.has(tag));
    }

    async function renameTag(tag: string, newTagName: string) {
        if (!newTagName || tag === newTagName) {
            return;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        newTagName = utils.cleanUpTag(newTagName, meta.config.maximumTagLength) as string;

        await Topics.createEmptyTag(newTagName);
        const allCids = {};

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await batch.processSortedSet(`tag:${tag}:topics`, async (tids: string[]) => {
            const topicData = await Topics.getTopicsFields(tids, ['tid', 'cid', 'tags']);
            const cids = topicData.map(t => t.cid);
            topicData.forEach((t) => { allCids[t.cid] = true; });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const scores = await db.sortedSetScores(`tag:${tag}:topics`, tids) as number[];
            // update tag:<tag>:topics
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            await db.sortedSetAdd(`tag:${newTagName}:topics`, scores, tids);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            await db.sortedSetRemove(`tag:${tag}:topics`, tids);

            // update cid:<cid>:tag:<tag>:topics
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            await db.sortedSetAddBulk(topicData.map(
                (t, index) => [`cid:${t.cid}:tag:${newTagName}:topics`, scores[index], t.tid]
            )) as number[];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            await db.sortedSetRemove(cids.map(cid => `cid:${cid}:tag:${tag}:topics`), tids);

            // update 'tags' field in topic hash
            topicData.forEach((topic) => {
                topic.tags = topic.tags.map(tagItem => tagItem.value);
                const index = topic.tags.indexOf(tag);
                if (index !== -1) {
                    topic.tags.splice(index, 1, newTagName);
                }
            });
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            await db.setObjectBulk(
                topicData.map(t => [`topic:${t.tid}`, { tags: t.tags.join(',') }]),
            );
        }, {});
        await Topics.deleteTag(tag);
        await updateTagCount(newTagName);
        await Topics.updateCategoryTagsCount(Object.keys(allCids), [newTagName]);
    }

    async function removeTagsFromTopics(tags: string[]) {
        await Promise.all(tags.map(async (tag) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const tids = await db.getSortedSetRange(`tag:${tag}:topics`, 0, -1) as string[];
            if (!tids.length) {
                return;
            }
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            await db.deleteObjectFields(
                tids.map(tid => `topic:${tid}`),
                ['tags'],
            ) as number[];
        }));
    }

    async function getFromSet(set: string | string[], start: number, stop: number): Promise<string[]> {
        let tags: string[];
        if (Array.isArray(set)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            tags = await db.getSortedSetRevUnion({
                sets: set,
                start,
                stop,
                withScores: true,
            }) as string[];
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            tags = await db.getSortedSetRevRangeWithScores(set, start, stop) as string[];
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const payload = await plugins.hooks.fire('filter:tags.getAll', {
            tags: tags,
        }) as { tags: Topic[] };
        return Topics.getTagData(payload.tags);
    }

    async function findMatches(data: Topic): Promise<Topic> {
        let { query } = data;
        let tagWhitelist = [] as Topic[];
        if (parseInt(data.cid, 10)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            tagWhitelist = await categories.getTagWhitelist([data.cid]) as Topic[];
        }
        let tags = [] as Topic[];
        if (Array.isArray(tagWhitelist[0]) && tagWhitelist[0].length) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const scores = await db.sortedSetScores(`cid:${data.cid}:tags`, tagWhitelist[0]) as number[];
            tags = tagWhitelist[0].map((tag: string, index) => ({ value: tag, score: scores[index] } as Topic));
        } else if (data.cids) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            tags = await db.getSortedSetRevUnion({
                sets: data.cids.map(cid => `cid:${cid}:tags`),
                start: 0,
                stop: -1,
                withScores: true,
            }) as Topic[];
        } else {
            tags = await getAllTags() as Topic[];
        }

        query = query.toLowerCase();

        const matches = [] as string[];
        for (let i = 0; i < tags.length; i += 1) {
            if (tags[i].value && tags[i].value.toLowerCase().startsWith(query)) {
                matches.push(tags[i] as string);
                if (matches.length > 39) {
                    break;
                }
            }
        }

        matches.sort((a: string, b: string) => {
            if (a < b) {
                return -1;
            } else if (a > b) {
                return 1;
            }
            return 0;
        });
        return { matches: matches } as Topic;
    }

    Topics.createTags = async function (tags, tid, timestamp) {
        if (!Array.isArray(tags) || !tags.length) {
            return;
        }

        const cid = await Topics.getTopicField(tid, 'cid');
        const topicSets = tags.map(tag => `tag:${tag}:topics`).concat(
            tags.map(tag => `cid:${cid}:tag:${tag}:topics`)
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.sortedSetsAdd(topicSets, timestamp, tid);
        await Topics.updateCategoryTagsCount([cid], tags);
        await Promise.all(tags.map(updateTagCount));
    };

    Topics.filterTags = async function (tags, cid) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const result = await plugins.hooks.fire('filter:tags.filter', { tags: tags, cid: cid }) as Topic;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        tags = _.uniq(result.tags)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            .map(tag => utils.cleanUpTag(tag, meta.config.maximumTagLength as number) as string)
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            .filter(tag => tag && tag.length >= (meta.config.minimumTagLength || 3));

        return await filterCategoryTags(tags, cid);
    };

    Topics.updateCategoryTagsCount = async function (cids, tags: string[]) {
        await Promise.all(cids.map(async (cid) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const counts = await db.sortedSetsCard(
                tags.map(tag => `cid:${cid}:tag:${tag}:topics`)
            ) as number[];
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const tagToCount = _.zipObject(tags, counts) as Topic;
            const set = `cid:${cid}:tags`;
            
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const bulkAdd = tags.filter(tag => tagToCount[tag] > 0)
                .map(tag => [set, tagToCount[tag], tag]) as string[][];
            
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const bulkRemove = tags.filter(tag => tagToCount[tag] <= 0)
                .map(tag => [set, tag]);

            await Promise.all([
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
                db.sortedSetAddBulk(bulkAdd),
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
                db.sortedSetRemoveBulk(bulkRemove),
            ]);
        }));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
        await db.sortedSetsRemoveRangeByScore(
            cids.map(cid => `cid:${cid}:tags`), '-inf', 0
        );
    };

    Topics.validateTags = async function (tags, cid, uid, tid = null) {
        if (!Array.isArray(tags)) {
            throw new Error('[[error:invalid-data]]');
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        tags = _.uniq(tags);
        const [categoryData, isPrivileged, currentTags] = await Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            categories.getCategoryFields(cid, ['minTags', 'maxTags']) as Category,
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            user.isPrivileged(uid) as boolean,
            tid ? Topics.getTopicTags(tid) : [] as string[],
        ]);
        if (tags.length < parseInt(categoryData.minTags, 10)) {
            throw new Error(`[[error:not-enough-tags, ${categoryData.minTags}]]`);
        } else if (tags.length > parseInt(categoryData.maxTags, 10)) {
            throw new Error(`[[error:too-many-tags, ${categoryData.maxTags}]]`);
        }

        const addedTags = tags.filter(tag => !currentTags.includes(tag));
        const removedTags = currentTags.filter(tag => !tags.includes(tag));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const systemTags = (meta.config.systemTags || '').split(',') as string;

        if (!isPrivileged && systemTags.length &&
            addedTags.length && addedTags.some(tag => systemTags.includes(tag))) {
            throw new Error('[[error:cant-use-system-tag]]');
        }

        if (!isPrivileged && systemTags.length &&
            removedTags.length && removedTags.some(tag => systemTags.includes(tag))) {
            throw new Error('[[error:cant-remove-system-tag]]');
        }
    };

    Topics.createEmptyTag = async function (tag) {
        if (!tag) {
            throw new Error('[[error:invalid-tag]]');
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        if (tag.length < (meta.config.minimumTagLength || 3)) {
            throw new Error('[[error:tag-too-short]]');
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const isMember = await db.isSortedSetMember('tags:topic:count', tag) as boolean;
        if (!isMember) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            await db.sortedSetAdd('tags:topic:count', 0, tag);
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            cache.del('tags:topic:count');
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const allCids = await categories.getAllCidsFromSet('categories:cid') as string[];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const isMembers = await db.isMemberOfSortedSets(
            allCids.map(cid => `cid:${cid}:tags`), tag
        ) as boolean[];
        const bulkAdd = allCids.filter((cid, index) => !isMembers[index])
            .map(cid => ([`cid:${cid}:tags`, 0, tag]));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.sortedSetAddBulk(bulkAdd);
    };

    Topics.renameTags = async function (data) {
        for (const tagData of data) {
            // eslint-disable-next-line no-await-in-loop
            await renameTag(tagData.value, tagData.newName);
        }
    };

    Topics.getTagTids = async function (tag, start, stop) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const tids = await db.getSortedSetRevRange(`tag:${tag}:topics`, start, stop) as number[];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const payload = await plugins.hooks.fire('filter:topics.getTagTids', { tag, start, stop, tids }) as { tids: string[] };
        return payload.tids;
    };

    Topics.getTagTidsByCids = async function (tag, cids, start, stop) {
        const keys = cids.map(cid => `cid:${cid}:tag:${tag}:topics`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const tids = await db.getSortedSetRevRange(keys, start, stop) as string[];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const payload = await plugins.hooks.fire('filter:topics.getTagTidsByCids', { tag, cids, start, stop, tids }) as { tids: string[] };
        return payload.tids;
    };

    Topics.getTagTopicCount = async function (tag, cids = [] as string[]) {
        let count = 0;
        if (cids.length) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            count = await db.sortedSetsCardSum(
                cids.map(cid => `cid:${cid}:tag:${tag}:topics`)
            ) as number;
        } else {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            count = await db.sortedSetCard(`tag:${tag}:topics`) as number;
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const payload = await plugins.hooks.fire('filter:topics.getTagTopicCount', { tag, count, cids }) as { count: number };
        return payload.count;
    };

    Topics.deleteTags = async function (tags) {
        if (!Array.isArray(tags) || !tags.length) {
            return;
        }
        await removeTagsFromTopics(tags);
        const keys = tags.map(tag => `tag:${tag}:topics`);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.deleteAll(keys);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.sortedSetRemove('tags:topic:count', tags);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        cache.del('tags:topic:count');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const cids = await categories.getAllCidsFromSet('categories:cid') as number[];

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.sortedSetRemove(cids.map(cid => `cid:${cid}:tags`), tags);

        const deleteKeys = [] as string[];
        tags.forEach((tag) => {
            deleteKeys.push(`tag:${tag}`);
            cids.forEach((cid) => {
                deleteKeys.push(`cid:${cid}:tag:${tag}:topics`);
            });
        });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.deleteAll(deleteKeys);
    };

    Topics.deleteTag = async function (tag) {
        await Topics.deleteTags([tag]);
    };

    Topics.getTags = async function (start, stop) {
        return await getFromSet('tags:topic:count', start, stop);
    };

    Topics.getCategoryTags = async function (cids, start, stop) {
        if (Array.isArray(cids)) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            return await db.getSortedSetRevUnion({
                sets: cids.map(cid => `cid:${cid}:tags`),
                start,
                stop,
            }) as string[];
        }
    };

    Topics.getCategoryTagsData = async function (cids, start, stop) {
        return await getFromSet(
            Array.isArray(cids) ? cids.map(cid => `cid:${cid}:tags`) : `cid`,
            start,
            stop
        );
    };

    Topics.getTagData = function (tags) {
        if (!tags.length) {
            return [] as string[];
        }
        tags.forEach((tag) => {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            tag.valueEscaped = validator.escape(String(tag.value)) as string;
            tag.valueEncoded = encodeURIComponent(tag.valueEscaped);
            tag.class = tag.valueEscaped.replace(/\s/g, '-');
        });
        return tags as string[];
    };

    Topics.getTopicTags = async function (tid) {
        const data = await Topics.getTopicsTags([tid]);
        return data && data[0];
    };

    Topics.getTopicsTags = async function (tids) {
        const topicTagData = await Topics.getTopicsFields(tids, ['tags']);
        return tids.map((tid, i) => topicTagData[i].tags.map(tagData => tagData.value)) as string[][];
    };

    Topics.getTopicTagsObjects = async function (tid) {
        const data = await Topics.getTopicsTagsObjects([tid]);
        return Array.isArray(data) && data.length ? data[0] : [];
    };

    Topics.getTopicsTagsObjects = async function (tids) {
        const topicTags = await Topics.getTopicsTags(tids);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const uniqueTopicTags = _.uniq(_.flatten(topicTags)) as string[];

        const tags = uniqueTopicTags.map(tag => ({ value: tag }));
        const tagData = Topics.getTagData(tags);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const tagDataMap = _.zipObject(uniqueTopicTags, tagData) as Record<string, string>;

        topicTags.forEach((tags, index) => {
            if (Array.isArray(tags)) {
                topicTags[index] = tags.map(tag => tagDataMap[tag]);
            }
        });

        return topicTags;
    };

    Topics.addTags = async function (tags, tids) {
        const topicData = await Topics.getTopicsFields(tids, ['tid', 'cid', 'timestamp', 'tags']);
        const bulkAdd = [] as TopicField[];
        const bulkSet = [] as TopicField[];
        topicData.forEach((t) => {
            const topicTags = t.tags.map(tagItem => tagItem.value);
            tags.forEach((tag: string) => {
                bulkAdd.push([`tag:${tag}:topics`, t.timestamp, t.tid]);
                bulkAdd.push([`cid:${t.cid}:tag:${tag}:topics`, t.timestamp, t.tid]);
                if (!topicTags.includes(tag)) {
                    topicTags.push(tag);
                }
            });
            bulkSet.push([`topic:${t.tid}`, { tags: topicTags.join(',') }]);
        });
        await Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            db.sortedSetAddBulk(bulkAdd),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            db.setObjectBulk(bulkSet),
        ]);

        await Promise.all(tags.map(updateTagCount));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await Topics.updateCategoryTagsCount(_.uniq(topicData.map(t => t.cid)), tags);
    };

    Topics.removeTags = async function (tags, tids) {
        const topicData = await Topics.getTopicsFields(tids, ['tid', 'cid', 'tags']);
        const bulkRemove = [];
        const bulkSet = [];

        topicData.forEach((t) => {
            const topicTags = t.tags.map(tagItem => tagItem.value);
            tags.forEach((tag: string) => {
                bulkRemove.push([`tag:${tag}:topics`, t.tid]);
                bulkRemove.push([`cid:${t.cid}:tag:${tag}:topics`, t.tid]);
                if (topicTags.includes(tag)) {
                    topicTags.splice(topicTags.indexOf(tag), 1);
                }
            });
            bulkSet.push([`topic:${t.tid}`, { tags: topicTags.join(',') }]);
        });
        await Promise.all([
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            db.sortedSetRemoveBulk(bulkRemove),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            db.setObjectBulk(bulkSet),
        ]);

        await Promise.all(tags.map(updateTagCount));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await Topics.updateCategoryTagsCount(_.uniq(topicData.map(t => t.cid)), tags);
    };

    Topics.updateTopicTags = async function (tid, tags) {
        await Topics.deleteTopicTags(tid);
        const cid = await Topics.getTopicField(tid, 'cid');

        tags = await Topics.filterTags(tags, cid);
        await Topics.addTags(tags, [tid]);
    };

    Topics.deleteTopicTags = async function (tid) {
        const topicData = await Topics.getTopicFields(tid, ['cid', 'tags']) as Topic;
        const { cid } = topicData;
        const tags = topicData.tags2.map(tagItem => tagItem.value);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.deleteObjectField(`topic:${tid}`, 'tags');

        const sets = tags.map(tag => `tag:${tag}:topics`)
            .concat(tags.map(tag => `cid:${cid}:tag:${tag}:topics`));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        await db.sortedSetsRemove(sets, tid);

        await Topics.updateCategoryTagsCount([cid], tags);
        await Promise.all(tags.map(updateTagCount));
    };

    Topics.searchTags = async function (data) {
        if (!data || !data.query) {
            return [] as string[];
        }
        let result: Topic;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (plugins.hooks.hasListeners('filter:topics.searchTags')) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            result = await plugins.hooks.fire('filter:topics.searchTags', { data: data }) as Topic;
        } else {
            result = await findMatches(data);
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        result = await plugins.hooks.fire('filter:tags.search', { data: data, matches: result.matches as Topic[] }) as Topic;
        return result.matches;
    };

    Topics.autocompleteTags = async function (data) {
        if (!data || !data.query) {
            return [] as string[];
        }
        let result: Topic;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        if (plugins.hooks.hasListeners('filter:topics.autocompleteTags')) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            result = await plugins.hooks.fire('filter:topics.autocompleteTags', { data: data }) as Topic;
        } else {
            result = await findMatches(data);
        }
        return result.matches;
    };

    Topics.searchAndLoadTags = async function (data) {
        const searchResult = {
            tags: [] as string[],
            matchCount: 0,
            pageCount: 1,
        } as Topic;

        if (!data || !data.query || !data.query.length) {
            return searchResult;
        }
        const tags = await Topics.searchTags(data) as Topic[];

        const tagData = Topics.getTagData(tags.map(tag => ({ value: tag.value }))) as Topic[];

        tagData.forEach((tag, index) => {
            tag.score = tags[index].score;
        });
        tagData.sort((a, b) => b.score - a.score);
        searchResult.tags = tagData as string[];
        searchResult.matchCount = tagData.length;
        searchResult.pageCount = 1;
        return searchResult;
    };

    Topics.getRelatedTopics = async function (topicData, uid) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
        if (plugins.hooks.hasListeners('filter:topic.getRelatedTopics')) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
            const result = await plugins.hooks.fire('filter:topic.getRelatedTopics', { topic: topicData, uid: uid, topics: [] }) as Topic;
            return result.topics;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        let maximumTopics = meta.config.maximumRelatedTopics as number;
        if (maximumTopics === 0 || !topicData.tags || !topicData.tags.length) {
            return [] as Topic[];
        }

        maximumTopics = maximumTopics || 5;
        let tids = await Promise.all(topicData.tags2.map(tag => Topics.getTagTids(tag.value,
            0,
            5))) as string[] | string[][];
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        tids = _.shuffle(_.uniq(_.flatten(tids))).slice(0, maximumTopics);
        const topics = await Topics.getTopics(tids, uid);
        return topics.filter(t => t && !t.deleted && parseInt(t.uid, 10) !== parseInt(uid, 10));
    };
};
