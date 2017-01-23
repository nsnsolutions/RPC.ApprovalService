'use strict';

const lib = require('../lib');
const rpcUtils = require('rpc-utils');
const AWS = require('aws-sdk');
const lodash = require('lodash');

module.exports = function ApprovalListPlugin(opts) {

    var seneca = this,
        env = opts.env,
        shared = lib.shared(seneca, opts),
        redis = opts.redisClient,
        ddb = new AWS.DynamoDB.DocumentClient({ service: opts.dynamoClient }),
        approvalTableName = opts.tables.approval.tableName,
        logLevel = opts.logLevel;

    const sortFields = [
        'jobId',
        'price',
        'quantity',
        'title',
        'type',
        'disposition',
        'updateDate',
        'requestDate',
        'completeDate',
    ];

    const sortDirs = {
        'asc': 'ascending',
        'desc': 'descending',
        'ascending': 'ascending',
        'descending': 'descending'
    };

    seneca.rpcAdd('role:approvalService.Pub,cmd:listClientApprovalRecords.v1', listClientApprovalRecords_v1);
    seneca.rpcAdd('role:approvalService.Pub,cmd:listSponsorApprovalRecords.v1', listSponsorApprovalRecords_v1);

    return { name: "ApprovalListPlugin" };

    // ------------------------------------------------------------------------

    function listClientApprovalRecords_v1(args, rpcDone) {
        var params = {
            logLevel: args.get("logLevel", logLevel),
            repr: lib.repr.ApprovalListEntity_v1,
            name: "List Client Approval Records (v1)",
            code: "LCAR01",
            done: rpcDone
        }

        params.tasks = [
            shared.getAuthorityFromToken,
            validate,
            getClientRecords,
            getClientApprovers,
            sortResults,
            getSetOfJobIds,
            paginateResults
        ];

        rpcUtils.Executor(params).run(args);
    }

    function listSponsorApprovalRecords_v1(args, rpcDone) {
        var params = {
            logLevel: args.get("logLevel", logLevel),
            repr: lib.repr.passthru,
            name: "List Sponsor Approval Records (v1)",
            code: "LSAR01",
            done: rpcDone
        }

        params.tasks = [
            shared.getAuthorityFromToken,
            validate,
            getSponsorRecords,
            getSponsorApprovers,
            sortResults,
            getSetOfJobIds,
            paginateResults
        ];

        rpcUtils.Executor(params).run(args);
    }

    function validate(console, state, done) {

        /*
         * pageSize: Integer. Set the number of items in 1 page of data.
         * pageIndex: Integer. Select the page number to return. Zero based list. The first page is index zero.
         *
         * dateField: Select the date field (requestDate, completeDate, updateDate) used to apply range filters.
         * startDate: ISO8601 String. When provided, limits data to only requests created after this date.
         * endDate: ISO8601 String. When provided, limits data to only requests create before this date.
         *
         * sortBy: String. The name of a field defined in ApprovalEntity model used to sort the items array.
         * sortDir: String. A value indicating the sort direction. One of: "ascending", "descending"
         * filterBy: Filter String (see below). Defines additional limiting filters to apply to the query.
         */

        console.info("Validating Client request.");

        /*
         * Start with normalizing the date filters if they are given.
         */

        if(state.has('startDate'))
            state.set('startDate', rpcUtils.helpers.fmtDate(state.startDate));

        if(state.has('endDate'))
            state.set('endDate', rpcUtils.helpers.fmtDate(state.endDate));

        /*
         * Normalize filterBy param if they are given.
         */

        var _filterBy = rpcUtils.FilterHelper.parseFilterString(state.get('filterBy', ""));

        /*
         * Verify we know who is making this request.
         */

        if(!state.has('person', Object))
            return done({
                name: "internalError",
                message: "Failed to load authority." });

        /*
         * Pagination
         */

        else if(state.has('pageIndex') && !state.has('pageSize'))
            return done({
                name: 'badRequest',
                message: 'Missing required field: pageSize' });

        if(state.has('pageSize') && !state.has('pageSize', Number))
            return done({
                name: 'badRequest',
                message: 'Wrong type for field: pageSize. Expected: Number' });

        else if(state.has('pageSize') && state.pageSize <= 0)
            return done({
                name: 'badRequest',
                message: 'Invalid value for field: pageSize. Expected: Positive, Non-Zero' });

        else if(state.has('pageIndex') && !state.has('pageIndex', Number))
            return done({
                name: 'badRequest',
                message: 'Wrong type for field: pageIndex. Expected: Number' });

        else if(state.has('pageIndex') && state.pageIndex < 1)
            return done({
                name: 'badRequest',
                message: 'Invalid value for field: pageIndex. Expected: Positive, Non-Zero' });

        /*
         * Date Filtering
         */

        else if((state.has('startDate') || state.has('endDate')) && !state.has('dateField'))
            return done({
                name: 'badRequest',
                message: 'Missing required field: dateField' });

        else if(state.has('dateField') && !state.has('dateField', String))
            return done({
                name: 'badRequest',
                message: 'Wrong type for field: dateField. Expected: String' });

        else if(state.has('startDate') && !state.has('startDate', String))
            return done({
                name: 'badRequest',
                message: 'Wrong type for field: startDate. Expected: String' });

        else if(state.has('startDate') && state.startDate === 'Invalid date')
            return done({
                name: 'badRequest',
                message: 'Invalid value for field: startDate. Expected: Date as ISO8601' });

        else if(state.has('endDate') && !state.has('endDate', String))
            return done({
                name: 'badRequest',
                message: 'Wrong type for field: endDate. Expected: String' });

        else if(state.has('endDate') && state.endDate === 'Invalid date')
            return done({
                name: 'badRequest',
                message: 'Invalid value for field: endDate. Expected: Date as ISO8601' });

        /*
         * Sorting
         */

        else if(state.has('sortDir') && !state.has('sortBy'))
            return done({
                name: 'badRequest',
                message: 'Missing required field: sortBy' });

        else if(state.has('sortBy') && !state.has('sortBy', String))
            return done({
                name: 'badRequest',
                message: 'Wrong type for field: sortBy. Expected: String' });

        else if(state.has('sortBy') && sortFields.indexOf(state.sortBy) < 0)
            return done({
                name: 'badRequest',
                message: 'Invalid value for field: sortBy. Expected: ' + sortFields.join(' ') });

        else if(state.has('sortDir') && !state.has('sortDir', String))
            return done({
                name: 'badRequest',
                message: 'Wrong type for field: sortDir. Expected: String' });

        else if(state.has('sortDir') && Objects.keys(sortDirs).indexOf(state.sortDir) < 0)
            return done({
                name: 'badRequest',
                message: 'Invalid value for field: sortDir. Expected: ascending or descending' });

        /*
         * Filtering
         */

        else if(state.has('filterBy') && !state.has('filterBy', String))
            return done({
                name: 'badRequest',
                message: 'Wrong type for field: filterBy. Expected: String' });

        else if(state.has('filterBy') && _filterBy === null)
            return done({
                name: 'badRequest',
                message: 'invalid value for field: filterBy. See documentation for more information.' });

        /*
         * Set Defaults
         */

        state.ensureExists('pageIndex', 1);
        state.ensureExists('sortBy', state.get('dateField', 'requestDate'));

        if(_filterBy) 
            state.set('filterBy', _filterBy);

        if(state.has('sortDir'))
            state.set('sortDir', sortDirs[state.sortDir]);

        done(null, state);
    }

    function getSponsorRecords(console, state, done) {

        console.info("Searching for sponsor records.");

        var params = buildQuery({
            indexName: 'sponsorId-jobId-index',
            keyField: 'sponsorId',
            keyValue: state.person.sponsorId
        }, state);

        getRecords(params, console, state, done);
    }

    function getClientRecords(console, state, done) {

        console.info("Searching for client records.");

        var params = buildQuery({
            indexName: 'clientId-jobId-index',
            keyField: 'clientId',
            keyValue: state.person.clientId
        }, state);

        getRecords(params, console, state, done);
    }

    function getRecords(query, console, state, done) {

        console.debug("Running with query: ", query);

        ddb.query(query, (err, data) => {
            state.set('approvalRecords', data.Items);
            done(null, state);
        });
    }

    function buildQuery(opts, state) {
        var query = new rpcUtils.FilterHelper({
            TableName: approvalTableName,
            IndexName: opts.indexName,
            KeyConditionExpression: '#hkey = :hkey',
            ExpressionAttributeNames: { '#hkey': opts.keyField },
            ExpressionAttributeValues: { ':hkey': opts.keyValue }
        });

        /* Add Data filters if needed. */
        if(state.has('startDate') && state.has('endDate'))
            query.addFilter(state.dateField, 'BETWEEN', [ state.startDate, state.endDate ]);

        else if(state.has('startDate'))
            query.addFilter(state.dateField, '>=', [ state.startDate ]);

        else if(state.has('endDate'))
            query.addFilter(state.dateField, '<', [ state.endDate ]);

        /* Add filterBy filters if needed. */
        if(state.has('filterBy'))
            query.addFilters(state.filterBy);

        return query.compileQuery();
    }

    function getClientApprovers(console, state, done) {

        console.info("Retrieving list of approvers for this client.")

        var key = lib.helpers.makeApproverKeys(env, {
            client: state.person.clientId }).client;

        console.debug("Loading approvers from key: " + key);

        redis.hgetall(key, (err, result) => {

            if(err)
                return done({
                    name: 'internalError',
                    message: 'Failed to retrieve list of approvers.',
                    innerError: err });

            console.log(result);
            var approvers = [];
            for(var p in result)
                if(result.hasOwnProperty(p))
                    approvers.push(JSON.parse(result[p]));

            state.set('approverList', approvers);

            done(null, state);
        });
    }

    function getSponsorApprovers(console, state, done) {

        console.info("Retrieving list of approvers for this sponsor.")

        var key = lib.helpers.makeApproverKeys(env, {
            sponsor: state.person.sponsorId }).sponsor;

        console.debug("Loading approvers from key: " + key);

        redis.get(key, (err, result) => {

            if(err)
                return done({
                    name: 'internalError',
                    message: 'Failed to retrieve list of approvers.',
                    innerError: err });

            state.set('approverList', result && JSON.parse(result) || []);

            done(null, state);
        });
    }

    function sortResults(console, state, done) {

        console.info("Sorting Results.");

        var result = lodash.sortBy(
            state.approvalRecords,
            [ state.get('sortBy'), 'clientId' ]);

        if(state.get('sortDir', 'ascending') === 'descending')
            state.set('approvalRecords', result.reverse());
        else
            state.set('approvalRecords', result);

        done(null, state);
    }

    function getSetOfJobIds(console, state, done) {

        console.info("Loading list of all jobIds.");
        var result = lodash.map(state.approvalRecords, 'jobId');
        state.set('approvalRecordJobIds', result);
        done(null, state);
    }

    function paginateResults(console, state, done) {

        console.info("Paginating Results.");

        state.set('totalCount', state.approvalRecords.length);
        state.ensureExists('pageSize', state.totalCount);

        var offset = (state.pageIndex - 1) * state.pageSize;

        var result = state.approvalRecords
            .slice(offset, offset + state.pageSize);

        state.set('approvalRecords', result);

        done(null, state);
    }
};

