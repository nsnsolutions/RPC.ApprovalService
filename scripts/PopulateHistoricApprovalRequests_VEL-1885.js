
/* 
 * VEL-1885 : VFS Redis Caching - Approval service database backing to RDS
 ******************************************************************************
 * This script will copy the content from the Dynamo table to aura RDS.
 * The dynamo table is identified in etcd config (key in package.json) and the
 * RDS tables are: approvalService_person, approvalService_request.
 *
 * A etcd connection will be attempted on the URL defined in the
 * SERVICE_DISCOVERY_URI environment variable. if the variable is not set, a
 * connection to local host will be attempted.
 */

'use strict';

const PACKAGE = require('./package.json');
const AWS = require('aws-sdk');
const Bookshelf = require('bookshelf');
const Knex = require('knex');
const Etcd = require('node-etcd');
const Promise = require('bluebird');
const lodash = require('lodash');
const q = require('q');
const rpcUtils = require('rpc-utils');
const Upsert = require('../src/lib/bookshelf-upsert');
const Models = require('../src/lib/Models');
const helpers = require('../src/lib/helpers');

/** PROTO **/
var getConfigs = q.async(_getConfigs);

function *main() {

    var conf = yield getConfigs(),
        ddbClient = Promise.promisifyAll(new AWS.DynamoDB.DocumentClient({ region: conf.region }));

    var knexClient = Knex({
        client: conf.rdsUrl.split(':').shift(),
        connection: conf.rdsUrl,
        //debug: true
    });

    var bookshelf = Bookshelf(knexClient);
    bookshelf.plugin(Upsert);

    var models = Models(bookshelf),
        result = {};

    console.log(`Importing items from DynamoDB table ${conf.approvalTable}...`);

    do {

        console.log("\nFetching a batch of records...");

        var params = {
            TableName: conf.approvalTable,
            Limit: 500
        };

        if(result.LastEvaluatedKey)
            params.ExclusiveStartKey = result.LastEvaluatedKey;

        result = yield ddbClient.scanAsync(params)
            .catch(e=>console.error(e));

        if(result.Count > 0) {
            var persons = new models.Persons,
                requests = new models.Requests;

            console.log(`Found ${result.Count}. Processing...`);

            // Need to add approvers first otherwise they will not be flagged
            // as approvers if they ever sent a request.

            persons.add(lodash.transform(result.Items, (ret, rec)=>{
                if(rec.completedBy && rec.completedBy.userId) {
                    ret.push(new models.Person({
                        id: helpers.makePersonKey(
                            rec.completedBy.sponsorId,
                            rec.completedBy.clientId,
                            rec.completedBy.userId),
                        userId: rec.completedBy.userId,
                        sponsorId: rec.completedBy.sponsorId,
                        clientId: rec.completedBy.clientId,
                        fullName: rec.completedBy.fullName,
                        email: rec.completedBy.email,
                        isApprover: true
                    }));
                }
            }));

            persons.add(lodash.transform(result.Items, (ret, rec)=>{
                ret.push(new models.Person({
                    id: helpers.makePersonKey(
                        rec.author.sponsorId,
                        rec.author.clientId,
                        rec.author.userId),
                    userId: rec.author.userId,
                    sponsorId: rec.author.sponsorId,
                    clientId: rec.author.clientId,
                    fullName: rec.author.fullName,
                    email: rec.author.email
                }));
            }));

            requests.add(lodash.transform(result.Items, (ret, rec) => {
                ret.push(new models.Request({
                    jobId: rec.jobId,
                    type: rec.type,
                    jobUniqueId: rec.jobUniqueId || null,
                    title: rec.title,
                    price: rec.price || 0,
                    quantity: rec.quantity || 1,
                    disposition: rec.disposition,
                    comments: rec.comments || null,
                    authorId: helpers.makePersonKey(
                        rec.author.sponsorId,
                        rec.author.clientId,
                        rec.author.userId ),
                    approverId: rec.completedBy &&
                        rec.completedBy.userId &&
                        helpers.makePersonKey(
                            rec.completedBy.sponsorId,
                            rec.completedBy.clientId,
                            rec.completedBy.userId) || null ,
                    completed_at: rpcUtils.helpers.toDate(rec.completeDate),
                    created_at: rpcUtils.helpers.toDate(rec.requestDate),
                    updated_at: rpcUtils.helpers.toDate(rec.updateDate),
                }));
            }));

            process.stdout.write(`Inserting Persons:  ${persons.models.length} |>`);
            for(var m of persons.models) {
                yield m.upsert();
                process.stdout.write("\b=>");
            }
            process.stdout.write("\b|");

            process.stdout.write(`\nInserting Requests: ${requests.models.length} |>`);
            for(var m of requests.models) {
                yield m.upsert();
                process.stdout.write("\b=>");
            }
            process.stdout.write("\b|");

            console.log(`\nBatch Completed: ${result.Count} items processed.`);
        }

    } while(result.LastEvaluatedKey);

    knexClient.destroy();
}

function *_getConfigs() {

    var etcd = Promise.promisifyAll(new Etcd(process.env.SERVICE_DISCOVERY_URI || undefined)),
        ret = {};

    for(let k in PACKAGE.etcdKeys)
        ret[k] = yield etcd.getAsync(PACKAGE.etcdKeys[k]).then(a=>a.node.value)

    return ret;
}

q.spawn(main);
