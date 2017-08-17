'use strict';

const computeRedisKey = require('rpc-utils').helpers.computeRedisKey;

module.exports = {
    makeMetricKeys: makeMetricKeys,
    makeApproverKeys: makeApproverKeys,
    //makeRedisKeys: makeRedisKeys
};

function makeMetricKeys(keyMap) {
    return computeRedisKey("approvalService", "Metrics", keyMap);
}

function makeApproverKeys(keyMap) {
    return computeRedisKey("approvalService", "Approvers", keyMap);
}

/*
function makeRedisKeys(group, env, keyMap) {

    var ret = {};

    for(var prop in keyMap)
        if(keyMap.hasOwnProperty(prop))
            ret[prop] = `${group}-${env}:${prop}:${keyMap[prop]}`;

    return ret;
}
*/
