'use strict';

const ApprovalEntity_v1 = require('./ApprovalEntity_v1');
const Person_v1 = require('./Person_v1');

module.exports = function ApprovalListEntity_v1(o) {
    return {
        jobIds: o.approvalRecordJobIds,
        items: o.approvalRecords.serialize_v1(),
        approvers: o.approverList.serialize_v1(),
        totalCount: o.totalCount,
        pageIndex: o.pageIndex,
        itemPerPage: o.pageSize,
    };
};

