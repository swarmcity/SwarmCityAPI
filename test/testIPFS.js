'use strict';
require('dotenv').config({
	path: '../.env',
});

const should = require('should');

const ipfsService = require('../services').ipfsService;

describe('functional test of IPFSService', function() {
    before(function() {
        if (!process.env.TESTIPFS || process.env.TESTIPFS == '0') {
            this.skip();
        }
    });

    let helloworldIPFShash = 'QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKT';

    it('ipfs.cat test', function(done) {
        ipfsService.cat(helloworldIPFShash).then((data) => {
            should(data).equal('hello world!');
            done();
        }).catch((e) => {
            done();
        });
    });
});
