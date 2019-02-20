'use strict';
const dbc = require('../connections/db').db;
const DBService = require('./db').DBService;
const dbService = new DBService(
    dbc,
    {
        'hashtagproxycontract': process.env.HASHTAGPROXYCONTRACT,
        'hashtagproxycontractstartblock': process.env.HASHTAGPROXYSTARTBLOCK,
    }
);

module.exports = {
    'dbService': dbService,
};
