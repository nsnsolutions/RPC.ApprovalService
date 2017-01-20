'use strict';

const lib = require('../lib');
const rpcUtils = require('rpc-utils');
const AWS = require('aws-sdk');
const lodash = require('lodash');

module.exports = function ApprovalFetchPlugin(opts) {

    var seneca = this,
        env = opts.env,
        shared = lib.shared(seneca, opts),
        logLevel = opts.logLevel;

    seneca.rpcAdd('role:approvalService.Pub,cmd:fetchApprovalRecord.v1', fetchApprovalRecord_v1);

    return { name: 'ApprovalFetchPlugin' };

    // ------------------------------------------------------------------------

    function fetchApprovalRecord_v1 (args, rpcDone) {

        var params = {
            logLevel: args.get("logLevel", logLevel),
            repr: lib.repr.ApprovalEntity_v1,
            name: "Fetch Approval Record (v1)",
            code: "EAR01",
            done: rpcDone
        }

        params.tasks = [
            shared.getAuthorityFromToken,
            validate,
            shared.fetchApprovalRecordByClient
        ];

        rpcUtils.Executor(params).run(args);
    }

    function validate(console, state, done) {

        console.info("Validating Client request.");

        if(!state.has('person', Object))
            return done({
                name: "internalError",
                message: "Failed to load authority." });

        else if(!state.has('jobId'))
            return done({
                name: "badRequest",
                message: "Missing required field: jobId." });

        else if(!state.has('jobId', String))
            return done({
                name: "badRequest",
                message: 'Wrong type for field: jobId. Expected: String' });

        done(null, state);
    }
};
