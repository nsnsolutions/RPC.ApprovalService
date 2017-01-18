'use strict';

module.exports = function ApprovalEntity_v1(o) {
    return {
        disposition: o.approvalRecord.disposition,
        type: o.approvalRecord.type,
        jobId: o.approvalRecord.jobId,
        jobUniqueId: o.approvalRecord.jobUniqueId || null,
        title: o.approvalRecord.title,
        price: o.approvalRecord.price,
        quantity: o.approvalRecord.quantity,
        author: {
            sponsorId: o.approvalRecord.author.sponsorId,
            clientId: o.approvalRecord.author.clientId,
            userId: o.approvalRecord.author.userId,
            email: o.approvalRecord.author.email,
            fullName: o.approvalRecord.author.fullName,
        },
        completedBy: o.approvalRecord.completedBy || null,
        requestDate: o.approvalRecord.requestDate,
        completeDate: o.approvalRecord.completeDate || null
    }
}
