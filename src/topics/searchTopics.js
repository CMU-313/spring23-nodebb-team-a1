'use strict';

const db = require('../database');

module.exports = function (Topics) {
    Topics.searchTopics = async function (query, options) {
        if (!query){
            return [];
        }
        query = String(query).toLowerCase();
        let tidsTest = await db.getSortedSetRange(`topics:recent`, 0, -1);
        let topicsTest = await Topics.getTopicsByTids(tidsTest, {});
        const res = topicsTest.filter(topic => topic.title.toLowerCase().includes(query) &&
            topic.deleted != 1);
        return res;
    };
};