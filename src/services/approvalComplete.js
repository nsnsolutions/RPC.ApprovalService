'use strict';

const lib = require('../lib');
const rpcUtils = require('rpc-utils');
const async = require('async');
const rpcfw = require('rpcfw');

module.exports = function ApprovalCompletePlugin(opts) {

    var seneca = this,
        proxy = opts.proxy,
        env = opts.env,
        shared = lib.shared(seneca, opts),
        redis = opts.redisClient,
        logLevel = opts.logLevel;

    seneca.rpcAdd('role:approvalService.Pub,cmd:finalizeApprovalRequest.v1', finalizeApprovalRequest_v1);

    return { name: "ApprovalListPlugin" };

    // ------------------------------------------------------------------------

    function finalizeApprovalRequest_v1(args, rpcDone) {

        var params = {
            logLevel: args.get("logLevel", logLevel),
            repr: lib.repr.FinalizeResponseEntity_v1,
            name: "Finalize Approval Request (v1)",
            code: "FAR01",
            done: rpcDone
        }

        params.tasks = [
            shared.getAuthorityFromToken,
            validate,
            fetchApprovalRecords,
            updateApprovalRecords,
            updateApprovalMetrics,
            shared.addPersonAsApprover,
            finalizeJob
        ];

        rpcUtils.Executor(params).run(args);

    }

    function validate(console, state, done) {

        console.info("Validating client  request.");

        if(!state.has('person', Object))
            return done({
                name: "internalError",
                message: "Failed to load authority." });

        else if(!state.person.hasAuthority('JOB:30'))
            return done({
                name: "forbidden",
                message: "Unable to complete request: Insufficient privileges" });

        else if(!state.has('jobIds'))
            return done({
                name: "badRequest",
                message: "Missing required field: jobIds" });

        else if(!state.has('jobIds', Array))
            return done({
                name: "badRequest",
                message: 'Wrong type for field: jobIds. Expected: Array' });

        else if(!state.has('disposition'))
            return done({
                name: "badRequest",
                message: "Missing required field: disposition" });

        else if(!state.has('disposition', String))
            return done({
                name: "badRequest",
                message: 'Wrong type for field: disposition. Expected: String' });

        else if(["approved", "declined"].indexOf(state.disposition) < 0)
            return done({
                name: "badRequest",
                message: 'Invalid value for field: disposition. Expected: approved or declined' });

        else if(state.has('comments') && !state.has('comments', String))
            return done({
                name: "badRequest",
                message: 'Wrong type for field: comments. Expected: String' });

        done(null, state);
    }

    function fetchApprovalRecords(console, state, done) {

        console.info("Fetching approval records.");

        async.map(state.jobIds, 

            (jobId, next) => {

                var _state = new rpcfw.verifiableObject({
                    person: state.person,
                    jobId: jobId
                });

                shared.fetchApprovalRecordByClient(console, _state, (err, result) => {
                    if(err)
                        return next(err);
                    next(null, result.approvalRecord);
                });
            }, 

            (err, results) => {
                if(err)
                    return done(err);

                state.set('approvalRecords', results);
                done(null, state);
            }

        );
    }

    function updateApprovalRecords(console, state, done) {

        console.info("Updating Approval records.");

        var completedApprovalRecords = [];

        async.map(state.approvalRecords,

            (record, next) => {

                if(record.disposition !== lib.disposition.PENDING)
                    return next(null, {
                        jobId: record.jobId,
                        success: false,
                        message: "Record already finalized." });

                record.comments = state.comments;
                record.disposition = lib.disposition[state.disposition];
                record.completeDate = rpcUtils.helpers.fmtDate();
                record.completedBy = state.person;
                record.$save({ logLevel: console.level }, (err) => {

                    if(err)
                        return next(null, {
                            jobId: record.jobId,
                            success: false,
                            message: err.message });

                    completedApprovalRecords.push(record);

                    next(null, {
                        jobId: record.jobId,
                        success: true,
                        message: "Completed successfully" });
                });
            },

            (err, results) => {
                if(err)
                    return done({
                        name: 'internalError',
                        message: 'Failed to finalize approval requests.',
                        innerError: err });

                state.set('results', results);
                state.set('approvalRecords', completedApprovalRecords);
                state.set('hasError', state.jobIds.length > state.approvalRecords.length)

                done(null, state);
            }
        );
    }

    function updateApprovalMetrics(console, state, done) {

        console.info("Updating Metrics.");

        var inc= state.disposition === lib.disposition.APPROVED
            ? 'incApprovedCount'
            : 'incDeclinedCount';

        var _state = rpcfw.verifiableObject({
            person: state.person,
            count: state.approvalRecords.length
        });

        if(_state.count <= 0)
            return done(null, state);

        shared[inc](console, _state, (err, result) => done(err, state));
    }

    function finalizeJob(console, state, done) {

        console.info("Finalizing Job.");

        done(null, state);

        /* Do this async - It could take a waile. */

        async.map(state.approvalRecords,

            (record, next) => {

                var params = { 
                    logLevel: console.level,
                    jobId: record.jobId,
                    token: state.token
                };

                proxy.jobService.processJob(params, (err, result) => {
                    if(err)
                        console.warn("Failed to finalize job.\n", err);

                    else if(record.disposition === lib.disposition.APPROVED)
                        _raiseEvent(console, {
                            token: params.token,
                            logLevel: params.logLevel,
                            type: 'PrintJobApproved',
                            jobId: params.jobId,
                            comments: record.comments,
                            eventDate: rpcUtils.helpers.fmtDate()
                        });

                    else if(record.disposition === lib.disposition.DECLINED)
                        _raiseEvent(console, {
                            token: params.token,
                            logLevel: params.logLevel,
                            type: 'PrintJobDeclined',
                            jobId: params.jobId,
                            comments: record.comments,
                            eventDate: rpcUtils.helpers.fmtDate()
                        });

                    next();
                });

            },

            (err, results) => console.log("Completed finalizing jobs.")
        );
    }

    function _raiseEvent(console, eventParams) {

        console.log(`Raising '${eventParams.type}' Event (Background Task)`);

        proxy.eventService.raiseEvent(eventParams, (err, data) => {
            if(err)
                console.error("Failed to raise event.\n", err);
            else
                console.debug("Event raised successfully.");
        });
    }

};
