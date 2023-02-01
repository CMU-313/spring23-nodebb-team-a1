'use strict';

const path = require('path');
const fs = require('fs');
const util = require('util');
const mkdirp = require('mkdirp');
const rimraf = require('rimraf');

const rimrafAsync = util.promisify(rimraf);

const file = require('../file');
const plugins = require('../plugins');
const minifier = require('./minifier');

const JS = module.exports;

JS.scripts = {
    base: [
        'node_modules/@adactive/bootstrap-tagsinput/src/bootstrap-tagsinput.js',
        'node_modules/jquery-serializeobject/jquery.serializeObject.js',
        'node_modules/jquery-deserialize/src/jquery.deserialize.js',
        'public/vendor/bootbox/wrapper.js',
    ],

    // plugins add entries into this object,
    // they get linked into /build/public/src/modules
    modules: {
        '../admin/plugins/persona.js': 'themes/nodebb-theme-persona/public/admin.js',
        'persona/quickreply.js': 'themes/nodebb-theme-persona/public/modules/quickreply.js',
        '../client/account/theme.js': 'themes/nodebb-theme-persona/public/settings.js',
    },
};

const basePath = path.resolve(__dirname, '../..');

async function linkModules() {
    const { modules } = JS.scripts;

    await Promise.all([
        mkdirp(path.join(__dirname, '../../build/public/src/admin/plugins')),
        mkdirp(path.join(__dirname, '../../build/public/src/client/plugins')),
    ]);

    await Promise.all(Object.keys(modules).map(async (relPath) => {
        const srcPath = path.join(__dirname, '../../', modules[relPath]);
        const destPath = path.join(__dirname, '../../build/public/src/modules', relPath);
        const [stats] = await Promise.all([
            fs.promises.stat(srcPath),
            mkdirp(path.dirname(destPath)),
        ]);
        if (stats.isDirectory()) {
            await file.linkDirs(srcPath, destPath, true);
        } else {
            await fs.promises.copyFile(srcPath, destPath);
        }
    }));
}

const moduleDirs = ['modules', 'admin', 'client'];

async function clearModules() {
    const builtPaths = moduleDirs.map(
        p => path.join(__dirname, '../../build/public/src', p)
    );
    await Promise.all(
        builtPaths.map(builtPath => rimrafAsync(builtPath))
    );
}

JS.buildModules = async function () {
    await clearModules();

    const fse = require('fs-extra');
    await fse.copy(
        path.join(__dirname, `../../public/src`),
        path.join(__dirname, `../../build/public/src`)
    );

    await linkModules();
};

JS.linkStatics = async function () {
    await rimrafAsync(path.join(__dirname, '../../build/public/plugins'));

    await Promise.all(Object.keys(plugins.staticDirs).map(async (mappedPath) => {
        const sourceDir = plugins.staticDirs[mappedPath];
        const destDir = path.join(__dirname, '../../build/public/plugins', mappedPath);

        await mkdirp(path.dirname(destDir));
        await file.linkDirs(sourceDir, destDir, true);
    }));
};

async function getBundleScriptList(target) {
    const pluginDirectories = [];

    if (target === 'admin') {
        target = 'acp';
    }
    let pluginScripts = plugins[`${target}Scripts`].filter((path) => {
        if (path.endsWith('.js')) {
            return true;
        }

        pluginDirectories.push(path);
        return false;
    });

    await Promise.all(pluginDirectories.map(async (directory) => {
        const scripts = await file.walk(directory);
        pluginScripts = pluginScripts.concat(scripts);
    }));

    pluginScripts = JS.scripts.base.concat(pluginScripts).map((script) => {
        const srcPath = path.resolve(basePath, script).replace(/\\/g, '/');
        return {
            srcPath: srcPath,
            filename: path.relative(basePath, srcPath).replace(/\\/g, '/'),
        };
    });

    return pluginScripts;
}

JS.buildBundle = async function (target, fork) {
    const filename = `scripts-${target}.js`;
    const files = await getBundleScriptList(target);
    const minify = false; // webpack will minify in prod
    const filePath = path.join(__dirname, '../../build/public', filename);

    await minifier.js.bundle({
        files: files,
        filename: filename,
        destPath: filePath,
    }, minify, fork);
};

JS.killMinifier = function () {
    minifier.killAll();
};
