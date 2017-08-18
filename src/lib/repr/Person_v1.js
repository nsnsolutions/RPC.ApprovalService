'use strict';

module.exports = function Person_v1(o) {
    var person = o.person || o;
    return person.serialize_v1();
};
