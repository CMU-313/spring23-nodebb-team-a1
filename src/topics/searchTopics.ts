import db = require('../database');

import { TopicObject } from '../types';

interface topic extends TopicObject {
    searchTopics: (query: string) => object,
    getTopicsByTids: (arg1: number, arg2: object) => Promise<TopicObject[]>,
}

export = function searchTopics(Topics: topic) {
    Topics.searchTopics = async (query) => {
        if (!query) {
            return [];
        }
        query = String(query).toLowerCase();
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const tidsTest = await db.getSortedSetRange(`topics:recent`, 0, -1) as number;
        const topicObjects = await Topics.getTopicsByTids(tidsTest, {});
        const res = topicObjects.filter(topic => topic.title.toLowerCase().includes(query));
        return res;
    };
}
