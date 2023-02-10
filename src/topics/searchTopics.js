'use strict';

const db = require('../database');

module.exports = function (Topics) {
    Topics.searchTopics = async function (query) {
        if (!query) {
            return [];
        }
        query = String(query).toLowerCase();
        const tidsTest = await db.getSortedSetRange(`topics:recent`, 0, -1);
        const topicsTest = await Topics.getTopicsByTids(tidsTest, {});
        const res = topicsTest.filter(topic => topic.title.toLowerCase().includes(query) &&
            topic.deleted !== 1);
        return res;
    };
};
