'use strict';

var lodash = require('lodash');
//var moment = require('moment');
//var rpcUtils = require('rpc-utils');

module.exports = Models;

function Models(bookshelf) {

    var Person = bookshelf.Model.extend({ 
        tableName: 'approvalService_person',
        idAttribute: 'id',
        requests: function() { return this.hasMany(Request) },

        serialize_v1: function() { 

            var ret = lodash.pick(this.attributes, [
                'sponsorId',
                'clientId',
                'email',
                'fullName'
            ]);

            ret.userId = this.attributes.id;

            return ret;
        }
    });

    var Request = bookshelf.Model.extend({ 
        tableName: 'approvalService_request',
        idAttribute: 'jobId',
        hasTimestamps: [ "created_at", "updated_at", ],
        author: function() { return this.belongsTo(Person, "authorId"); },
        approver: function() { return this.belongsTo(Person, "approverId"); },

        serialize_v1: function() { 

            var ret = lodash.pick(this.attributes, [
                'disposition',
                'type',
                'jobId',
                'jobUniqueId',
                'title',
                'price',
                'quantity',
                'comments',
            ]);

            ret.requestDate = this.attributes.created_at;
            ret.completeDate = this.attributes.completed_at || null;

            if(this.relations) {

                ret.author = this.relations.author &&
                    this.relations.author.id &&
                    this.relations.author.serialize_v1() ||
                    null;

                ret.completedBy = this.relations.approver &&
                    this.relations.approver.id &&
                    this.relations.approver.serialize_v1() ||
                    null;
            }

            return ret;
        }

    });

    return {
        /* Tables */
        Request: Request,
        Person: Person,

        /* Collections */
        Requests: bookshelf.Collection.extend({
            model: Request,
            serialize_v1: function() {
                return lodash.map(this.models, v=>v.serialize_v1());
            }
        }),
        Persons: bookshelf.Collection.extend({ 
            model: Person,
            serialize_v1: function() {
                return lodash.map(this.models, v=>v.serialize_v1());
            }
        })
    }
}
