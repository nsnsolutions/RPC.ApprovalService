'use strict';

const ApprovalEntity_v1 = require('./ApprovalEntity_v1');
const Person_v1 = require('./Person_v1');

module.exports = function ApprovalListEntity_v1(o) {

    var items = [];
    var approvers = [];

    for(var i = 0; i < o.approvalRecords.length; i++) {
        var ar = o.approvalRecords[i];
        var arr = ApprovalEntity_v1({ approvalRecord: ar });
        items.push(arr);
    }

    for(var i = 0; i < o.approverList.length; i++) {
        var ar = o.approverList[i];
        var arr = Person_v1(ar);
        approvers.push(arr);
    }

    return {
        jobIds: o.approvalRecordJobIds,
        items: items,
        approvers: approvers,
        totalCount: o.totalCount,
        pageIndex: o.pageIndex,
        itemPerPage: o.pageSize,
    };
};

