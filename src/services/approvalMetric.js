'use strict';

const lib = require('../lib');
const rpcUtils = require('rpc-utils');

module.exports = function ApprovalMetricPlugin(opts) {

    var seneca = this,
        shared = lib.shared(seneca, opts),
        redis = opts.redisClient,
        logLevel = opts.logLevel;

    seneca.rpcAdd('role:approvalService.Pub,cmd:fetchClientMetrics.v1', fetchClientMetrics_v1);
    seneca.rpcAdd('role:approvalService.Pub,cmd:fetchSponsorMetrics.v1', fetchSponsorMetrics_v1);

    return { name: "ApprovalMetricPlugin" };

    // ------------------------------------------------------------------------

    function fetchClientMetrics_v1(args, rpcDone) {

        var params = {
            logLevel: args.get("logLevel", logLevel),
            repr: lib.repr.ApprovalStatusEntity_v1,
            name: "Fetch Client Metrics (v1)",
            code: "FCM01",
            done: rpcDone
        }

        params.tasks = [
            shared.getAuthorityFromToken,
            validate,
            getClientMetrics
        ];

        args.set('context', 'client');

        rpcUtils.Executor(params).run(args);
    }

    function fetchSponsorMetrics_v1(args, rpcDone) {

        var params = {
            logLevel: args.get("logLevel", logLevel),
            repr: lib.repr.ApprovalEntity_v1,
            name: "Fetch Sponsor Metrics (v1)",
            code: "FSM01",
            done: rpcDone
        }

        params.tasks = [
            shared.getAuthorityFromToken,
            validate
        ];

        args.set('context', 'sponsor');

        rpcUtils.Executor(params).run(args);
    }

    function validate(console, state, done) {

        console.info("Validate Client Request");

        if(!state.has('person', Object))
            return done({
                name: "internalError",
                message: "Failed to load authority." });

        else if(!state.person.hasAuthority('JOB:10'))
            return done({
                name: "forbidden",
                message: "Unable to complete request: Insufficient privileges" });

        done(null, state);
    }

    function getClientMetrics(console, state, done) {

        console.info("Get Client Metrics");

        var keys = lib.helpers.makeMetricKeys({
            client: state.person.clientId 
        });

        redis.hgetall(keys.client, (err, result) => {
            if(err) 
                return done({
                    name: 'internalError',
                    message: 'Failed to retrieve metrics.' });

            if(!result)
                return done({
                    name: 'notFound',
                    message: 'No metrics available.' });

            state.set('statusRecord', result);
            done(null, state);
        });
    }
};