'use strict';

const AWS = require('aws-sdk');
const redis = require('redis');
const rpcUtils = require('rpc-utils');
const services = require('./services');

module.exports = function RPC_ApprovalService(App) {

    // Simplify reference to configurations.
    var conf = App.configurations;

    // Validate Shared Configs
    conf.service.assertMember("approvalTableName");

    // Validate Service Configs.
    conf.shared.assertMember("region");
    conf.shared.assertMember("cacheEndpoint");
    conf.shared.assertMember("logLevel");
    conf.shared.assertMember("clusterName");

    var app = App({
        onConfigUpdate: () => app.restart(),
        onStart: bootstrap,
        onRestart: bootstrap,
        onShutdown:() => process.exit(0)
    });

    app.start();

    // ------------------------------------------------------------------------

    function bootstrap(bus, conf) {

        var redisClient = redis.createClient({ url: conf.shared.cacheEndpoint });
        var dynamoClient = new AWS.DynamoDB({ region: conf.shared.region });

        var tableCacheParams = {
            dynamoClient: dynamoClient,
            redisClient: redisClient,
            tableMap: {
                approval: conf.service.approvalTableName 
            }
        };

        rpcUtils.CachedTable.create(tableCacheParams, (err, tables) => {

            var params = {
                env: conf.shared.clusterName,
                logLevel: conf.shared.logLevel,
                tables: tables,
                redisClient: redisClient,
                dynamoClient: dynamoClient
            };

            bus.use(services.ApprovalCreatePlugin, params);
            bus.use(services.ApprovalMetricPlugin, params);
            bus.use(services.ApprovalListPlugin, params);

            bus.rpcClient({ pin: "role:*" });
            bus.rpcServer({ pin: [
                "role:approvalService",
                "role:approvalService.Pub"
            ]});

        });

    }
}
