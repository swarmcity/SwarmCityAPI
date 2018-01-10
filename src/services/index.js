'use strict';

const ipfsc = require('../connections/ipfs').ipfs;
const IPFSService= require('./ipfs').IPFSService;
const ipfsService = new IPFSService(ipfsc);

module.exports = {
    'ipfsService': ipfsService,
};
