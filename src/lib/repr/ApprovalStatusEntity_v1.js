'use strict';

module.exports = function ApprovalStatusEntity_v1(o) {
    return {
        approvedCount: o.statusRecord.approved || 0,
        declinedCount: o.statusRecord.declined || 0,
        pendingCount: o.statusRecord.pending || 0
    };
};
