'use strict';

const lib = require('../lib');
const rpcUtils = require('rpc-utils');
const Authorizers = rpcUtils.Principal.Authorizers;

module.exports = function ApprovalMetricPlugin(opts) {

    var seneca = this,
        redis = opts.redisClient,
        models = opts.models,
        logLevel = opts.logLevel;

    seneca.rpcAdd('role:approvalService.Pub,cmd:fetchClientMetrics.v1', fetchClientMetrics_v1);
    seneca.rpcAdd('role:approvalService.Pub,cmd:fetchSponsorMetrics.v1', fetchSponsorMetrics_v1);

    return { name: "ApprovalMetricPlugin" };

    // ------------------------------------------------------------------------

    function fetchClientMetrics_v1(args, rpcDone) {

        var params = {
            name: "Fetch Client Metrics (v1)",
            code: "FCM01",
            repr: lib.repr.ApprovalStatsEntity_v1,

            authorizer: Authorizers.with('JOB:10'),

            transport: seneca,
            logLevel: args.get("logLevel", logLevel),
            done: rpcDone,

            required: [ /* No Args */ ],
            optional: [ { field: "sync", type: Boolean, default: false } ],

            tasks: [
                getClientMetrics 
            ],

            postActions: [ 
                syncClientCache
            ]
        }

        rpcUtils.Workflow
            .Executor(params)
            .run(args);
    }

    function fetchSponsorMetrics_v1(args, rpcDone) {

        var params = {

            name: "Fetch Sponsor Metrics (v1)",
            code: "FSM01",
            repr: lib.repr.ApprovalStatsEntity_v1,

            authorizer: Authorizers.with('JOB:10'),

            transport: seneca,
            logLevel: args.get("logLevel", logLevel),
            done: rpcDone,

            required: [ /* No Args */ ],
            optional: [ { field: "sync", type: Boolean, default: false } ],

            tasks: [
                getSponsorMetrics
            ],

            postActions: [ 
                syncSponsorCache
            ]
        }

        rpcUtils.Workflow
            .Executor(params)
            .run(args);
    }

    function getClientMetrics(console, state, done) {

        if(state.get('sync') === true)
            return getClientMetrics_sync(console, state, done);

        console.info("Get Client Metrics");

        var key = lib.helpers.makeMetricKeys({ clientId: state.$principal.clientId });

        console.debug("Retrieving metrics with key: " + key);

        redis.hgetall(key, (err, result) => {
            if(err) 
                return done({
                    name: 'internalError',
                    message: 'Failed to retrieve metrics.' });

            else if(!result) {
                state.set('sync', true);
                return getClientMetrics_sync(console, state, done);
            }

            state.set('statusRecord', result);
            done(null, state);
        });
    }

    function getSponsorMetrics(console, state, done) {

        if(state.get('sync') === true)
            return getSponsorMetrics_sync(console, state, done);

        console.info("Get Sponsor Metrics");

        var key = lib.helpers.makeMetricKeys({ sponsorId: state.$principal.sponsorId });

        console.debug("Retrieving metrics with key: " + key);

        redis.hgetall(key, (err, result) => {
            if(err) 
                return done({
                    name: 'internalError',
                    message: 'Failed to retrieve metrics.' });

            else if(!result) {
                state.set('sync', true);
                return getSponsorMetrics_sync(console, state, done);
            }

            state.set('statusRecord', result);
            done(null, state);
        });
    }

    function getSponsorMetrics_sync(console, state, done) {

        models.Requests.query((q) => {
            return q
                .select('disposition')
                .count('jobId')
                .innerJoin('approvalService_person', 'approvalService_request.authorId', 'approvalService_person.id')
                .where('approvalService_person.sponsorId', state.$principal.sponsorId)
                .groupBy('approvalService_request.disposition')
        })

        .fetch().then((m) => {
            var result = {};
            for(var r of m.models)
                result[r.get('disposition')] = r.get('count(`jobId`)');
            state.set('statusRecord', result);
            return done(null, state);
        }, (e) => {
            return done({
                name: 'internalError',
                message: 'Failed to fetch metrics.',
                innerError: e.message 
            });
        });

    }

    function getClientMetrics_sync(console, state, done) {

        models.Requests.query((q) => {
            return q
                .select('disposition')
                .count('jobId')
                .innerJoin('approvalService_person', 'approvalService_request.authorId', 'approvalService_person.id')
                .where('approvalService_person.clientId', state.$principal.clientId)
                .groupBy('approvalService_request.disposition')
        })

        .fetch().then((m) => {
            var result = {};
            for(var r of m.models)
                result[r.get('disposition')] = r.get('count(`jobId`)');
            state.set('statusRecord', result);
            return done(null, state);
        }, (e) => {
            return done({
                name: 'internalError',
                message: 'Failed to fetch metrics.',
                innerError: e.message 
            });
        });

    }

    function syncClientCache(console, state, done) {

        if(state.get('sync') !== true)
            return done(null, state);

        console.info("Update Client Metrics");

        var key = lib.helpers.makeMetricKeys({ clientId: state.$principal.clientId });

        console.debug("Writing metrics with key: " + key);

        redis.multi()
            .hset(key, lib.disposition.PENDING, state.get('statusRecord.pending', 0))
            .hset(key, lib.disposition.APPROVED, state.get('statusRecord.approved', 0))
            .hset(key, lib.disposition.DECLINED, state.get('statusRecord.declined', 0))
            .exec(()=>done(null, state));
    }

    function syncSponsorCache(console, state, done) {

        if(state.get('sync') !== true)
            return done(null, state);

        console.info("Update Sponsor Metrics");

        var key = lib.helpers.makeMetricKeys({ sponsorId: state.$principal.sponsorId });

        console.debug("Writing metrics with key: " + key);

        redis.multi()
            .hset(key, lib.disposition.PENDING, state.get('statusRecord.pending', 0))
            .hset(key, lib.disposition.APPROVED, state.get('statusRecord.approved', 0))
            .hset(key, lib.disposition.DECLINED, state.get('statusRecord.declined', 0))
            .exec(()=>done(null, state));
    }

};
