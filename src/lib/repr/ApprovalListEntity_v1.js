'use strict';

const ApprovalEntity_v1 = require('./ApprovalEntity_v1');

module.exports = function ApprovalListEntity_v1(o) {

    var items = [];

    for(var i = 0; i < o.approvalRecords.length; i++) {
        var ar = o.approvalRecords[i];
        var arr = ApprovalEntity_v1({ approvalRecord: ar });
        items.push(arr);
    }

    return {
        jobIds: o.approvalRecordJobIds,
        items: items,
        approvers: o.approverList,
        totalCount: o.totalCount,
        pageIndex: o.pageIndex,
        itemPerPage: o.pageSize,
    };
};

