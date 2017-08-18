'use strict';

const computeRedisKey = require('rpc-utils').helpers.computeRedisKey;
const crypto = require('crypto');

module.exports = {
    makeMetricKeys: makeMetricKeys,
    makeApproverKeys: makeApproverKeys,
    principal2key: principal2key,
    makePersonKey: makePersonKey
};

function makeMetricKeys(keyMap) {
    return computeRedisKey("approvalService", "Metrics", keyMap);
}

function makeApproverKeys(keyMap) {
    return computeRedisKey("approvalService", "Approvers", keyMap);
}

function principal2key(p) {
    return makePersonKey(p.sponsorId, p.clientId, p.userId);
}

function makePersonKey(sponsorId, clientId, userId) {
    var hash = crypto.createHmac('sha256', userId);
    hash.update(`${sponsorId}${clientId}`);
    return hash.digest('hex');
}
