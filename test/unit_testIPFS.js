'use strict';

const should = require('should');
const ipfs = require('../globalIPFS')();

describe('globalIPFS', function() {
    describe('isIPFSHash()', function() {
        it('should always start with Qm', function() {
            should(ipfs.isIPFSHash('RneV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKT')).not.be.ok;
        });

        it('should always be 46 characeters long', function() {
            should(ipfs.isIPFSHash('QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKTX')).not.be.ok;
            should(ipfs.isIPFSHash('QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbK')).not.be.ok;
        });

        it('should work with a valid hash', function() {
            should(ipfs.isIPFSHash('QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKT')).be.ok;
        });
    });
});
