'use strict';

const winston = require('winston');

function warn(msg) {
    winston.warn(msg);
}

module.exports = require('../public/src/modules/translator.common')(require('./utils'), (lang, namespace) => {
    const languages = require('./languages');
    return languages.get(lang, namespace);
}, warn);
