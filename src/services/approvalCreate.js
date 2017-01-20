'use strict';

const lib = require('../lib');
const rpcUtils = require('rpc-utils');

module.exports = function ApprovalCreatePlugin(opts) {

    var seneca = this,
        shared = lib.shared(seneca, opts),
        logLevel = opts.logLevel;

    seneca.rpcAdd('role:approvalService.Pub,cmd:createApprovalRecord.v1', createApprovalRecord_v1);

    return { name: "ApprovalCreatePlugin" };

    // ------------------------------------------------------------------------

    function createApprovalRecord_v1(args, rpcDone) {
        
        var params = {
            logLevel: args.get("logLevel", logLevel),
            repr: lib.repr.ApprovalEntity_v1,
            name: "Create Approval Record (v1)",
            code: "CAR01",
            done: rpcDone
        }

        params.tasks = [
            shared.getAuthorityFromToken,
            validate,
            createRecord,
            shared.saveApprovalRecord,
            shared.incPendingCount
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

        else if(!state.has('type', String))
            return done({ 
                name: "badRequest",
                message: "Missing required field: type" });

        else if(!state.has('jobId', String))
            return done({ 
                name: "badRequest",
                message: "Missing required field: jobId" });

        else if(!state.has('title', String))
            return done({ 
                name: "badRequest",
                message: "Missing required field: title" });

        else if(!state.has('price', Number))
            return done({ 
                name: "badRequest",
                message: "Missing required field: price" });

        done(null, state);
    }

    function createRecord(console, state, done) {

        console.log("Creating new approval record.");

        state.raw.approvalRecord = {
            approvalId: rpcUtils.helpers.fmtUuid(),
            sponsorId: state.person.sponsorId,
            clientId: state.person.clientId,
            jobId: state.get('jobId'),
            type: state.get('type'),
            jobUniqueId: state.get('jobUniqueId'),
            title: state.get('title'),
            price: state.get('price'),
            quantity: state.get('quantity', 0),
            disposition: lib.disposition.PENDING,
            author: state.person,
            requestDate: rpcUtils.helpers.fmtDate(),
            updateDate: true /* cacheTable will set this value */
        };

        done(null, state);
    }
};
