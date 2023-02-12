import db = require('../database');

import { TopicObject } from '../types';

interface topic extends TopicObject {
    search: (query: string) => object,
    getTopicsByTids: (arg1: number, arg2: object) => TopicObject[],
}

export = function search(Topics: topic) {
    Topics.search = async (query) => {
        if (!query) {
            return [];
        }
        query = String(query).toLowerCase();
        const tidsTest = await db.getSortedSetRange(`topics:recent`, 0, -1) as number;
        const topicsTest = await Topics.getTopicsByTids(tidsTest, {});
        const res = topicsTest.filter(topic => topic.title.toLowerCase().includes(query));
        return res;
    }
}
