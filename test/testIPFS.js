'use strict';
require('dotenv').config({
	path: '../.env',
});

const should = require('should');
const logger = require('../logs')('Mocha');

const ipfsc = require('../connections/ipfs').ipfs;
const IPFSService= require('../services/ipfs').IPFSService;

describe('functional test of IPFSService', function() {
    before(function() {
        if (!process.env.TESTIPFS || process.env.TESTIPFS == '0') {
            this.skip();
        }
    });

    let helloworldIPFShash = 'QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKT';

    let ipfsService = new IPFSService(ipfsc);

    it('ipfs.cat test', function(done) {
        ipfsService.cat(helloworldIPFShash).then((data) => {
            logger.info('data', data);
            should(data).equal('hello world!');
            done();
        }).catch((e) => {
            done();
        });
    });
});
