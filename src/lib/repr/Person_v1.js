'use strict';

module.exports = function Person_v1(o) {
    var person = o.person || o;
    return {
        sponsorId: person.sponsorId,
        clientId: person.clientId,
        userId: person.userId,
        email: person.email,
        fullName: person.fullName
    };
};
