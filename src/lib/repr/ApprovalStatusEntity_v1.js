'use strict';

module.exports = function ApprovalStatusEntity_v1(o) {
    return {
        approvedCount: o.statusRecord.approved,
        declinedCount: o.statusRecord.declined,
        pendingCount: o.statusRecord.pending
    };
};
