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
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const tidsTest = await db.getSortedSetRange(`topics:recent`, 0, -1) as number;
        const topicsTest = Topics.getTopicsByTids(tidsTest, {});
        const res = topicsTest.filter(topic => topic.title.toLowerCase().includes(query));
        return res;
    };
}
