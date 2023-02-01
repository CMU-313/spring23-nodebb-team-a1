'use strict';

const path = require('path');
const nconf = require('nconf');

nconf.argv().env({
    separator: '__',
});
const winston = require('winston');
const { fork } = require('child_process');

const { env } = process;
let worker;

env.NODE_ENV = env.NODE_ENV || 'development';

const configFile = path.resolve(__dirname, nconf.any(['config', 'CONFIG']) || 'config.json');
const prestart = require('./src/prestart');

prestart.loadConfig(configFile);

const db = require('./src/database');
const plugins = require('./src/plugins');

module.exports = function (grunt) {
    const args = [];

    if (!grunt.option('verbose')) {
        args.push('--log-level=info');
        nconf.set('log-level', 'info');
    }
    prestart.setupWinston();

    grunt.initConfig({
        watch: {},
    });

    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['watch']);

    grunt.registerTask('init', async function () {
        const done = this.async();
        let pluginList = [];
        if (!process.argv.includes('--core')) {
            await db.init();
            pluginList = await plugins.getActive();
            if (!pluginList.includes('nodebb-plugin-composer-default')) {
                pluginList.push('nodebb-plugin-composer-default');
            }
        }

        const styleUpdated_Client = pluginList.map(p => `node_modules/${p}/*.less`)
            .concat(pluginList.map(p => `node_modules/${p}/*.css`))
            .concat(pluginList.map(p => `node_modules/${p}/+(public|static|less)/**/*.less`))
            .concat(pluginList.map(p => `node_modules/${p}/+(public|static)/**/*.css`));

        const styleUpdated_Admin = pluginList.map(p => `node_modules/${p}/*.less`)
            .concat(pluginList.map(p => `node_modules/${p}/*.css`))
            .concat(pluginList.map(p => `node_modules/${p}/+(public|static|less)/**/*.less`))
            .concat(pluginList.map(p => `node_modules/${p}/+(public|static)/**/*.css`));

        const clientUpdated = pluginList.map(p => `node_modules/${p}/+(public|static)/**/*.js`);
        const serverUpdated = pluginList.map(p => `node_modules/${p}/*.js`)
            .concat(pluginList.map(p => `node_modules/${p}/+(lib|src)/**/*.js`));

        const templatesUpdated = pluginList.map(p => `node_modules/${p}/+(public|static|templates)/**/*.tpl`);
        const langUpdated = pluginList.map(p => `node_modules/${p}/+(public|static|languages)/**/*.json`);

        grunt.config(['watch'], {
            styleUpdated_Client: {
                files: [
                    'public/less/**/*.less',
                    'themes/**/*.less',
                    ...styleUpdated_Client,
                ],
                options: {
                    interval: 1000,
                },
            },
            styleUpdated_Admin: {
                files: [
                    'public/less/**/*.less',
                    'themes/**/*.less',
                    ...styleUpdated_Admin,
                ],
                options: {
                    interval: 1000,
                },
            },
            clientUpdated: {
                files: [
                    'public/src/**/*.js',
                    'public/vendor/**/*.js',
                    ...clientUpdated,
                    'node_modules/benchpressjs/build/benchpress.js',
                ],
                options: {
                    interval: 1000,
                },
            },
            serverUpdated: {
                files: [
                    'app.js',
                    'install/*.js',
                    'src/**/*.js',
                    'public/src/modules/translator.common.js',
                    'public/src/modules/helpers.common.js',
                    'public/src/utils.common.js',
                    serverUpdated,
                    '!src/upgrades/**',
                ],
                options: {
                    interval: 1000,
                },
            },
            typescriptUpdated: {
                files: [
                    'install/*.ts',
                    'src/**/*.ts',
                    'public/src/**/*.ts',
                    'public/vendor/**/*.ts',
                ],
                options: {
                    interval: 1000,
                },
            },
            templatesUpdated: {
                files: [
                    'src/views/**/*.tpl',
                    'themes/**/*.tpl',
                    ...templatesUpdated,
                ],
                options: {
                    interval: 1000,
                },
            },
            langUpdated: {
                files: [
                    'public/language/en-GB/*.json',
                    'public/language/en-GB/**/*.json',
                    ...langUpdated,
                ],
                options: {
                    interval: 1000,
                },
            },
        });
        const build = require('./src/meta/build');
        if (!grunt.option('skip')) {
            await build.build(true, { watch: true });
        }
        run();
        done();
    });

    function run() {
        if (worker) {
            worker.kill();
        }

        const execArgv = [];
        const inspect = process.argv.find(a => a.startsWith('--inspect'));

        if (inspect) {
            execArgv.push(inspect);
        }

        worker = fork('app.js', args, {
            env,
            execArgv,
        });
    }

    grunt.task.run('init');

    grunt.event.removeAllListeners('watch');
    grunt.event.on('watch', (action, filepath, target) => {
        let compiling;
        if (target === 'styleUpdated_Client') {
            compiling = 'clientCSS';
        } else if (target === 'styleUpdated_Admin') {
            compiling = 'acpCSS';
        } else if (target === 'clientUpdated' || target === 'typescriptUpdated') {
            compiling = 'js';
        } else if (target === 'templatesUpdated') {
            compiling = 'tpl';
        } else if (target === 'langUpdated') {
            compiling = 'lang';
        } else if (target === 'serverUpdated') {
            // empty require cache
            const paths = ['./src/meta/build.js', './src/meta/index.js'];
            paths.forEach(p => delete require.cache[require.resolve(p)]);
            return run();
        }

        require('./src/meta/build').build([compiling], { webpack: false }, (err) => {
            if (err) {
                winston.error(err.stack);
            }
            if (worker) {
                worker.send({ compiling: compiling });
            }
        });
    });
};
