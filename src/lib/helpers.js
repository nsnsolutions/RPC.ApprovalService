'use strict';

const computeRedisKey = require('rpc-utils').helpers.computeRedisKey;

module.exports = {
    makeMetricKeys: makeMetricKeys,
    makeApproverKeys: makeApproverKeys,
};

function makeMetricKeys(keyMap) {
    return computeRedisKey("approvalService", "Metrics", keyMap);
}

function makeApproverKeys(keyMap) {
    return computeRedisKey("approvalService", "Approvers", keyMap);
}
