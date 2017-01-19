'use strict';

module.exports = function ApprovalListEntity_v1(o) {
    return {
        jobIds: o.approvalRecordJobIds,
        items: o.approvalRecords,
        approvers: o.approverList,
        totalCount: o.totalCount,
        pageIndex: o.pageIndex,
        itemPerPage: o.pageSize,
    };
};

