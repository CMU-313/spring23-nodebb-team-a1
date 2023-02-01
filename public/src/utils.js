/* eslint-disable no-redeclare */

'use strict';

const $ = require('jquery');

const utils = { ...require('./utils.common') };

utils.getLanguage = function () {
    let lang = 'en-GB';
    if (typeof window === 'object' && window.config && window.utils) {
        lang = utils.params().lang || config.userLang || config.defaultLang || 'en-GB';
    }
    return lang;
};


utils.makeNumbersHumanReadable = function (elements) {
    elements.each(function () {
        $(this)
            .html(utils.makeNumberHumanReadable($(this).attr('title')))
            .removeClass('hidden');
    });
};

utils.addCommasToNumbers = function (elements) {
    elements.each(function (index, element) {
        $(element)
            .html(utils.addCommas($(element).html()))
            .removeClass('hidden');
    });
};

utils.findBootstrapEnvironment = function () {
    // http://stackoverflow.com/questions/14441456/how-to-detect-which-device-view-youre-on-using-twitter-bootstrap-api
    const envs = ['xs', 'sm', 'md', 'lg'];
    const $el = $('<div>');

    $el.appendTo($('body'));

    for (let i = envs.length - 1; i >= 0; i -= 1) {
        const env = envs[i];

        $el.addClass('hidden-' + env);
        if ($el.is(':hidden')) {
            $el.remove();
            return env;
        }
    }
};

utils.isMobile = function () {
    const env = utils.findBootstrapEnvironment();
    return ['xs', 'sm'].some(function (targetEnv) {
        return targetEnv === env;
    });
};

utils.assertPasswordValidity = (password, zxcvbn) => {
    // More checks on top of basic utils.isPasswordValid()
    if (!utils.isPasswordValid(password)) {
        throw new Error('[[user:change_password_error]]');
    } else if (password.length < ajaxify.data.minimumPasswordLength) {
        throw new Error('[[reset_password:password_too_short]]');
    } else if (password.length > 512) {
        throw new Error('[[error:password-too-long]]');
    }

    const passwordStrength = zxcvbn(password);
    if (passwordStrength.score < ajaxify.data.minimumPasswordStrength) {
        throw new Error('[[user:weak_password]]');
    }
};

utils.generateUUID = function () {
    // from https://github.com/tracker1/node-uuid4/blob/master/browser.js
    const temp_url = URL.createObjectURL(new Blob());
    const uuid = temp_url.toString();
    URL.revokeObjectURL(temp_url);
    return uuid.split(/[:/]/g).pop().toLowerCase(); // remove prefixes
};

module.exports = utils;
