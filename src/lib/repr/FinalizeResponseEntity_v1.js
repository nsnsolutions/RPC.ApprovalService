'use strict';

module.exports = function FinalizeResponseEntity_v1(o) {
    return {
        hasError: o.hasError,
        items: o.results
    };
};
