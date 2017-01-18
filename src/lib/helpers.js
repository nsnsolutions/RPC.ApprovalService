'use strict';

module.exports = {
    makeMetricKeys: makeMetricKeys
};

function makeMetricKeys(keyMap) {
    var ret = {};

    for(var prop in keyMap)
        if(keyMap.hasOwnProperty(prop))
            ret[prop] = `ApprovalMetric:${prop}:${keyMap[prop]}`;

    return ret;
}
