"use strict";
const db = require("../database");
module.exports = function searchTopics(Topics) {
    Topics.searchTopics = async (query) => {
        if (!query) {
            return [];
        }
        query = String(query).toLowerCase();
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const tidsTest = await db.getSortedSetRange(`topics:recent`, 0, -1);
        const topicObjects = await Topics.getTopicsByTids(tidsTest, {});
        const res = topicObjects.filter(topic => topic.title.toLowerCase().includes(query));
        return res;
    };
};
