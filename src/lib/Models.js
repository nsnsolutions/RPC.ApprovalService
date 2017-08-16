'use strict';

var lodash = require('lodash');

module.exports = Models;

function Models(bookshelf) {

    /* Tables */

    var Approval = bookshelf.Model.extend({ 
        tableName: 'approvalService_approval',
        idAttribute: 'id',
        hasTimestamps: [ "created_at", "updated_at", ],
    });

    var Disposition = bookshelf.Model.extend({ 
        tableName: 'approvalService_disposition',
        idAttribute: 'id',
    });

    var Person = bookshelf.Model.extend({ 
        tableName: 'approvalService_person',
        idAttribute: 'id',
    });

    /* Collections */
    var Approvals = bookshelf.Collection.extend({ model: Approval });
    var Dispositions = bookshelf.Collection.extend({ model: Disposition });
    var Persons  = bookshelf.Collection.extend({ model: Person });

    return {
        /* Tables */
        Approval: Approval,
        Disposition: Disposition,
        Person: Person,

        /* Collections */
        Approvals: Approvals,
        Dispositions: Dispositions,
        Persons: Persons,
    }
}
