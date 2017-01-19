'use strict';

module.exports = {
    makeMetricKeys: makeMetricKeys,
    makeApproverKeys: makeApproverKeys,
    makeRedisKeys: makeRedisKeys
};

function makeMetricKeys(env, keyMap) {
    return makeRedisKeys("ApprovalMetric", env, keyMap);
}

function makeApproverKeys(env, keyMap) {
    return makeRedisKeys("Approvers", env, keyMap);
}

function makeRedisKeys(group, env, keyMap) {

    var ret = {};

    for(var prop in keyMap)
        if(keyMap.hasOwnProperty(prop))
            ret[prop] = `${group}-${env}:${prop}:${keyMap[prop]}`;

    return ret;
}
