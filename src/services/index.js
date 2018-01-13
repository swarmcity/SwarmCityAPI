'use strict';

const ipfsc = require('../connections/ipfs').ipfs;
const IPFSService= require('./ipfs').IPFSService;
const ipfsService = new IPFSService(ipfsc);

const dbc = require('../connections/db').db;
const DBService = require('../services/db').DBService;
const dbService = new DBService(
    dbc,
    {
        'parameterscontract': process.env.PARAMETERSCONTRACT,
        'parameterscontractstartblock': process.env.PARAMETERSCONTRACTSTARTBLOCK,
    }
);

module.exports = {
    'ipfsService': ipfsService,
    'dbService': dbService,
};
