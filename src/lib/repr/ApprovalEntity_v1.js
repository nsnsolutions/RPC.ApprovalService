'use strict';

const Person_v1 = require('./Person_v1');

module.exports = function ApprovalEntity_v1(o) {
    return {
        disposition: o.approvalRecord.disposition,
        type: o.approvalRecord.type,
        jobId: o.approvalRecord.jobId,
        jobUniqueId: o.approvalRecord.jobUniqueId || null,
        title: o.approvalRecord.title,
        price: o.approvalRecord.price,
        quantity: o.approvalRecord.quantity,
        author: Person_v1(o.approvalRecord.author),
        completedBy: o.approvalRecord.completedBy && Person_v1(o.approvalRecord.completedBy) || null,
        requestDate: o.approvalRecord.requestDate,
        completeDate: o.approvalRecord.completeDate || null
    }
}
