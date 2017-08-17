'use strict';

const AWS = require('aws-sdk');
const Bookshelf = require('bookshelf');
const Knex = require('knex');
const Redis = require('redis');
const SchemaInstaller = require('knex-schema-builder');
const async = require('async');
const schemaPath = require('path').join(__dirname, './database')
const rpcUtils = require('rpc-utils');

const lib = require('./lib');
const Upsert = require('./lib/bookshelf-upsert');
const Models = require('./lib/Models');
const services = require('./services');

module.exports = function RPC_ApprovalService(App) {

    let redisClient, knexClient;

    var config = App.configurations;

    // Validate Shared Configs
    config.shared.assertMember("region");
    config.shared.assertMember("logLevel");
    config.shared.assertMember('rdsUrl');

    var app = App({
        onConfigUpdate: () => app.restart(),
        onStart: bootstrap,
        onRestart: restart,
        onShutdown: shutdown,
    });

    app.start();

    // ------------------------------------------------------------------------

    function bootstrap(bus, conf) {

        redisClient = Redis.createClient({ url: conf.shared.redisUrl });
        redisClient.on('error', onRedisError);

        knexClient = Knex({
            client: conf.shared.rdsUrl.split(':').shift(),
            connection: conf.shared.rdsUrl,
            debug: true
        });

        var startupTasks = [
            (cb) => SchemaInstaller.setTablePrefix('approvalService_', (err) => cb(err)),
            (cb) => initializeDatabase(schemaPath, cb),
            (cb) => installPlugins(bus, conf, cb)
        ];

        async.waterfall(startupTasks, (err) => {

            if(err) {
                console.error("FAILURE!", err);
                throw err;
            }

            // Allow outbound calls to everything.
            bus.rpcClient({ pin: "role:*" });

            // These are the route keys that the RabbitMQ queue will subscribe to
            // on the seneca rpc exchange. Only *.Pub keys are routed from
            // rpc.interface. non .Pub routes are used for interal calls only.

            bus.rpcServer({ pin: [
                "role:approvalService",
                "role:approvalService.Pub"
            ]});

            bus.on('close', () => {
                console.log("[ X:APP ] Seneca bus is shutting down...");
                bus.emit('stopConsuming');
            });

            bus.ready(() => {
                console.log("[ X:APP ] Seneca bus is ready...");
                setTimeout(() => bus.emit('startConsuming'), 3000);
            });

        });
    }

    function shutdown() {
        cleanUp();
        process.exit(0);
    }

    function restart(bus, conf) {
        cleanUp();
        bootstrap(bus, conf);
    }

    function installPlugins(bus, conf, callback) {

        var bookshelf = Bookshelf(knexClient);
        bookshelf.plugin(Upsert);

        var params = {
            logLevel: conf.shared.logLevel,
            redisClient: redisClient,
            bookshelf: bookshelf,
            models: Models(bookshelf)
        };

        bus.use(services.ProxyPlugin, params);
        bus.use(services.ApprovalCreatePlugin, params);
        bus.use(services.ApprovalFetchPlugin, params);
        bus.use(services.ApprovalCompletePlugin, params);
        bus.use(services.ApprovalMetricPlugin, params);
        //bus.use(services.ApprovalListPlugin, params);

        callback();
    }

    function initializeDatabase(path, callback) {

        console.info("[ X:APP ] Checking RDS Schema...");

        SchemaInstaller.isInstallNeeded(knexClient, path, (err, needsInstall) => {

            if(err)
                return callback(err);

            SchemaInstaller.isUpgradeNeeded(knexClient, path, (err, needsUpgrade) => {

                if(needsInstall) {

                    console.warn("[ X:APP ] Initializing RDS Database...");
                    SchemaInstaller.install(knexClient, path, (err, result) => {

                        if(err)
                            return callback(err);

                        console.warn("[ X:APP ] Initialization Complete");
                        console.log(result);
                        callback();
                    });

                } else if(needsUpgrade) {

                    console.warn("[ X:APP ] Upgrading RDS Database...");
                    SchemaInstaller.upgrade(knexClient, path, (err, result) => {

                        if(err)
                            return callback(err);

                        console.warn("[ X:APP ] Upgrade Complete");
                        console.log(result);
                        callback();
                    });

                } else {

                    callback();

                }
            });
        });
    }

    function cleanUp() {
        if(redisClient && redisClient.quit)
            redisClient.quit();

        if(knexClient && knexClient.destroy)
            knexClient.destroy();
    }

    function onRedisError(err) {
        try {
            console.log("ERROR (REDIS)", JSON.stringify(err));
        } catch (e) {
            console.log("ERROR (REDIS)", err);
        }
    }

}
