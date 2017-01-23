'use strict';

const lib = require('../lib');
const rpcUtils = require('rpc-utils');

module.exports = function ApprovalMetricPlugin(opts) {

    var seneca = this,
        env = opts.env,
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
            repr: lib.repr.ApprovalStatsEntity_v1,
            name: "Fetch Client Metrics (v1)",
            code: "FCM01",
            done: rpcDone
        }

        params.tasks = [
            shared.getAuthorityFromToken,
            validate,
            getClientMetrics
        ];

        rpcUtils.Executor(params).run(args);
    }

    function fetchSponsorMetrics_v1(args, rpcDone) {

        var params = {
            logLevel: args.get("logLevel", logLevel),
            repr: lib.repr.ApprovalStatsEntity_v1,
            name: "Fetch Sponsor Metrics (v1)",
            code: "FSM01",
            done: rpcDone
        }

        params.tasks = [
            shared.getAuthorityFromToken,
            validate,
            getSponsorMetrics
        ];

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

        var keys = lib.helpers.makeMetricKeys(env, {
            client: state.person.clientId
        });

        console.debug("Retrieving metrics with key: " + keys.client);

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

    function getSponsorMetrics(console, state, done) {

        console.info("Get Sponsor Metrics");

        var keys = lib.helpers.makeMetricKeys(env, {
            sponsor: state.person.sponsorId
        });

        console.debug("Retrieving metrics with key: " + keys.sponsor);

        redis.hgetall(keys.sponsor, (err, result) => {
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
