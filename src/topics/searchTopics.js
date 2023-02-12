"use strict";
const db = require("../database");
module.exports = function search(Topics) {
    Topics.search = async (query) => {
        if (!query) {
            return [];
        }
        query = String(query).toLowerCase();
        // The next line calls a function in a module that has not been updated to TS yet
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        const tidsTest = await db.getSortedSetRange(`topics:recent`, 0, -1);
        const topicsTest = Topics.getTopicsByTids(tidsTest, {});
        const res = topicsTest.filter(topic => topic.title.toLowerCase().includes(query));
        return res;
    };
};
