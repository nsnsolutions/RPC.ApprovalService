'use strict';

const lib = require('../lib');
const rpcUtils = require('rpc-utils');
const lodash = require('lodash');
const Authorizers = rpcUtils.Principal.Authorizers;

const sortFields = {
    'jobId': 'jobId',
    'price': 'price',
    'quantity': 'quantity',
    'title': 'title',
    'type': 'type',
    'disposition': 'disposition',
    'updateDate': 'updated_at',
    'requestDate': 'created_at',
    'completeDate': 'completed_at',
    'jobUniqueId': 'jobUniqueId',
    'author.fullName': 'author.fullName',
    'completedBy.fullName': 'approver.fullName'
};

const dateFields = {
    'updateDate': 'updated_at',
    'requestDate': 'created_at',
    'completeDate': 'completed_at',
};

const sortDirs = {
    'asc': 'asc',
    'ascending': 'asc',
    'desc': 'desc',
    'descending': 'desc'
};

const OPERATORS = {
    "EQ": "=",
    "LT": "<",
    "LE": "<=",
    "GT": ">",
    "GE": ">=",
    "BEGINSWITH": "like",
    "BETWEEN": "BETWEEN",
    "CONTAINS": "like",
    "IN": "IN"
};


module.exports = function ApprovalListPlugin(opts) {

    var seneca = this,
        shared = lib.shared(seneca, opts),
        redis = opts.redisClient,
        models = opts.models,
        logLevel = opts.logLevel;

    seneca.rpcAdd('role:approvalService.Pub,cmd:listClientApprovalRecords.v1', listClientApprovalRecords_v1);
    seneca.rpcAdd('role:approvalService.Pub,cmd:listSponsorApprovalRecords.v1', listSponsorApprovalRecords_v1);

    return { name: "ApprovalListPlugin" };

    // ------------------------------------------------------------------------

    function listSponsorApprovalRecords_v1(args, rpcDone) {

        rpcUtils.Executor(params).run(args);

        /*
         * Search, Sort, and page approval records as associated with the
         * current sponsor.
         *
         * Args:
         * - pageSize: The count of items in the paginated result
         * - pageIndex: The current page of the paginated result.
         * - dateField: The date field used for date fitering and default sort
         * - startDate: The first date to start looking for records.
         * - endDate: The last date to look for records.
         * - sortBy: The field to sort the result set by.
         * - sortDir: The direction the sort should be done.
         * - filterBy: Other filter criteria.
         */

        var params = {

            name: "List Sponsor Approval Records (v1)",
            code: "LSAR01",
            repr: lib.repr.ApprovalListEntity_v1,

            authorizer: Authorizers.with('JOB:30'),

            transport: seneca,
            logLevel: args.get("logLevel", logLevel),
            done: rpcDone,

            // This is used by the query builder to filter.
            accountFilterField: 'sponsorId',

            required: [ /* No Required Fields */ ],

            optional: [

                // Set the number of items in 1 page of data.
                {
                    field: "pageSize",
                    type: Number,
                    customValidator: i=>i>0,
                    default: 10
                },

                // Select the page number to return. Zero based list. The first
                // page is index zero.
                {
                    field: "pageIndex",
                    type: Number,
                    customValidator: i=>i>0,
                    default: 1
                },

                // Select the date field (requestDate, completeDate,
                // updateDate) used to apply range filters.
                {
                    field: "dateField",
                    type: String,
                    regex: `^${Object.keys(dateFields).join("|")}$`,
                    default: "requestDate"
                },

                // When provided, limits data to only requests after the value
                // stored in the column identified in dateField
                {
                    field: "startDate",
                    type: String,
                    customValidator: d=>!isNaN(rpcUtils.helpers.toDate(d).getTime()),
                    default: '1900-01-01'
                },

                // When provided, limits data to only requests before the value
                // stored in the column identified in dateField
                {
                    field: "endDate",
                    type: String,
                    customValidator: d=>!isNaN(rpcUtils.helpers.toDate(d).getTime()),
                    default: rpcUtils.helpers.fmtDate()
                },

                // The name of a field defined in ApprovalEntity model used to
                // sort the items array.
                {

                    field: "sortBy",
                    type: String,
                    regex: `^${Object.keys(sortFields).join("|")}$`
                },

                // A value indicating the sort direction. One of: "ascending",
                // "descending"
                {
                    field: "sortDir",
                    type: String,
                    regex: `^${Object.keys(sortDirs).join("|")}$`,
                    default: 'asc'
                },

                // Filter String (see below). Defines additional limiting
                // filters to apply to the query.
                {
                    field: "filterBy",
                    type: String,
                    customValidator: checkFilterBy
                },
            ],

            tasks: [
                translateToDatabaseFields,
                fetchRequests,
                fetchAllJobIds,
                fetchAllApprovers
            ],

            postActions: [ /* No Post Actions */ ]
        }

        rpcUtils.Workflow
            .Executor(params)
            .run(args);
    }

    function listClientApprovalRecords_v1(args, rpcDone) {

        /*
         * Search, Sort, and page approval records as associated with the
         * current client.
         *
         * Args:
         * - pageSize: The count of items in the paginated result
         * - pageIndex: The current page of the paginated result.
         * - dateField: The date field used for date fitering and default sort
         * - startDate: The first date to start looking for records.
         * - endDate: The last date to look for records.
         * - sortBy: The field to sort the result set by.
         * - sortDir: The direction the sort should be done.
         * - filterBy: Other filter criteria.
         */

        var params = {

            name: "List Client Approval Records (v1)",
            code: "LCAR01",
            repr: lib.repr.ApprovalListEntity_v1,

            authorizer: Authorizers.with('JOB:30'),

            transport: seneca,
            logLevel: args.get("logLevel", logLevel),
            done: rpcDone,

            // This is used by the query builder to filter.
            accountFilterField: 'clientId',

            required: [ /* No Required Fields */ ],

            optional: [

                // Set the number of items in 1 page of data.
                {
                    field: "pageSize",
                    type: Number,
                    customValidator: i=>i>0,
                    default: 10
                },

                // Select the page number to return. Zero based list. The first
                // page is index zero.
                {
                    field: "pageIndex",
                    type: Number,
                    customValidator: i=>i>0,
                    default: 1
                },

                // Select the date field (requestDate, completeDate,
                // updateDate) used to apply range filters.
                {
                    field: "dateField",
                    type: String,
                    regex: `^${Object.keys(dateFields).join("|")}$`,
                    default: "requestDate"
                },

                // When provided, limits data to only requests after the value
                // stored in the column identified in dateField
                {
                    field: "startDate",
                    type: String,
                    customValidator: d=>!isNaN(rpcUtils.helpers.toDate(d).getTime()),
                    default: '1900-01-01'
                },

                // When provided, limits data to only requests before the value
                // stored in the column identified in dateField
                {
                    field: "endDate",
                    type: String,
                    customValidator: d=>!isNaN(rpcUtils.helpers.toDate(d).getTime()),
                    default: rpcUtils.helpers.fmtDate()
                },

                // The name of a field defined in ApprovalEntity model used to
                // sort the items array.
                {

                    field: "sortBy",
                    type: String,
                    regex: `^${Object.keys(sortFields).join("|")}$`
                },

                // A value indicating the sort direction. One of: "ascending",
                // "descending"
                {
                    field: "sortDir",
                    type: String,
                    regex: `^${Object.keys(sortDirs).join("|")}$`,
                    default: 'asc'
                },

                // Filter String (see below). Defines additional limiting
                // filters to apply to the query.
                {
                    field: "filterBy",
                    type: String,
                    customValidator: checkFilterBy
                },
            ],

            tasks: [
                translateToDatabaseFields,
                fetchRequests,
                fetchAllJobIds,
                fetchAllApprovers
            ],

            postActions: [ /* No Post Actions */ ]
        }

        rpcUtils.Workflow
            .Executor(params)
            .run(args);


    }

    function translateToDatabaseFields(console, state, done) {

        // SortBy is not required but should default to whatever dateField was
        // selected.  Since date field is set pre-remap, we need to do this
        // first and map the field after.
        state.ensureExists('sortBy', state.dateField);

        // Map each field to the actual database name of the field.
        state.set('dateField', dateFields[state.dateField]);
        state.set('sortDir', sortDirs[state.sortDir]);
        state.set('sortBy', sortFields[state.sortBy]);

        // Convert dates to native Date object
        state.set('startDate', rpcUtils.helpers.toDate(state.startDate));
        state.set('endDate', rpcUtils.helpers.toDate(state.endDate));

        done(null, state);
    }

    function fetchRequests(console, state, done) {

        var ac = this.accountFilterField;

        var query = models.Requests.query((query) => {

            var ret = query
                .innerJoin('approvalService_person as author', 'approvalService_request.authorId', 'author.id')
                .leftOuterJoin('approvalService_person as approver', 'approvalService_request.approverId', 'approver.id')
                .where(`author.${ac}`, state.$principal[ac])
                .whereBetween(state.dateField, [ state.startDate, state.endDate ])
                .orderBy(state.sortBy, state.sortDir)
                .limit(state.pageSize)
                .offset(state.pageSize * (state.pageIndex - 1));

            ret = applyFilterBy(ret, state.filterBy);

            console.debug("Fetch Requests:",ret.toString());

            return ret;
        });

        query.fetch({ withRelated: [ 'author', 'approver' ] }).then((m) => {
            state.set('approvalRecords', m);
            done(null, state);
        }, (e)=>done({
            name: 'internalError',
            message: "Failed to fetch approval requests.",
            innerError: e.message 
        }));

    }

    function fetchAllJobIds(console, state, done) {

        var ac = this.accountFilterField;

        var query = models.Requests.query((query) => {

            var ret = query
                .select('jobId')
                .select(state.sortBy)
                .innerJoin('approvalService_person as author', 'approvalService_request.authorId', 'author.id')
                .leftOuterJoin('approvalService_person as approver', 'approvalService_request.approverId', 'approver.id')
                .where(`author.${ac}`, state.$principal[ac])
                .whereBetween(state.dateField, [ state.startDate, state.endDate ])
                .orderBy(state.sortBy, state.sortDir);

            ret = applyFilterBy(ret, state.filterBy);

            console.debug("Fetch All JobIds:",ret.toString());

            return ret;

        });

        query.fetch().then((m) => {
            state.set('totalCount', m.models.length);
            state.set('approvalRecordJobIds',
                lodash.transform(m.models, (res, m)=>res.push(m.get('jobId')))
            );
            done(null, state);
        }, (e)=>done({
            name: 'internalError',
            message: "Failed to fetch approval requests.",
            innerError: e.message 
        }));

    }

    function fetchAllApprovers(console, state, done) {

        var ac = this.accountFilterField;

        var query = models.Persons.query((query) => {

            var ret = query
                .where(ac, state.$principal[ac])
                .where("isApprover", true);

            console.debug("Fetch All Approvers:",ret.toString());

            return ret;

        });

        query.fetch().then((m) => {
            state.set('approverList', m);
            done(null, state);
        }, (e)=>done({
            name: 'internalError',
            message: "Failed to fetch approver list.",
            innerError: e.message 
        }));

    }

    // ------------------------------------------------------------------------

    function checkFilterBy(filterBy) {

        var isValid = true;

        if(typeof filterBy !== 'string')
            return false;

        lodash.forEach((filterBy).split(';'), (filterExp)=> {

            var _parts = (filterExp || "").split(':');
            var field = _parts.shift();
            var opSel = (_parts.shift() || "").toUpperCase();
            var oper = OPERATORS[opSel] || null;
            var val = _parts.shift() || "";

            if(field.length < 0)
                isValid = false;

            else if(oper === null)
                isValid = false;

            else if(val.length < 0)
                isValid = false;
        });

        return isValid;
    }

    function applyFilterBy(query, filterBy) {

        lodash.forEach((filterBy || "").split(';'), (filterExp)=> {

            var _parts = (filterExp || "").split(':');
            var field = _parts.shift();
            var opSel = (_parts.shift() || "").toUpperCase();
            var oper = OPERATORS[opSel];
            var val = _parts.shift() || "";

            switch(opSel) {

                case "BETWEEN":
                    query.whereBetween(field, val.split(','));
                    break;

                case "IN": 
                    query.whereIn(field, val.split(','));
                    break;

                case "CONTAINS":
                    val = `%${val}`;
                case "BEGINSWITH":
                    val = `${val}%`;
                case "EQ":
                case "LT":
                case "LE":
                case "GT":
                case "GE":
                    query.where(field, oper, val);
                    break;

                default:
                    console.warn("Warning: filterBy Expression ignored:", filterExp);
                    break;
            };
        });

        return query;
    }
};

