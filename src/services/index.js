'use strict';

const ipfsc = require('../connections/ipfs').ipfs;
const IPFSService= require('./ipfs').IPFSService;
const ipfsService = new IPFSService(ipfsc);

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
    'ipfsService': ipfsService,
    'dbService': dbService,
};
