'use strict';

const should = require('should');

const IPFSService= require('../services/ipfs').IPFSService;


describe('services/ipfs/IPFSService', function() {
    describe('isIPFSHash()', function() {
        let ipfsService = new IPFSService({});

        it('should always be a string', function() {
            should(ipfsService.isIPFSHash(12345678)).not.be.ok;
            should(ipfsService.isIPFSHash({})).not.be.ok;
        });

        it('should always start with Qm', function() {
            should(ipfsService.isIPFSHash('RneV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKT')).not.be.ok;
        });

        it('should always be 46 characeters long', function() {
            should(ipfsService.isIPFSHash('QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKTX')).not.be.ok;
            should(ipfsService.isIPFSHash('QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbK')).not.be.ok;
        });

        it('should work with a valid hash', function() {
            should(ipfsService.isIPFSHash('QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKT')).be.ok;
        });
    });

    describe('cat()', function() {
        it('should reject on IPFS failure', function() {
            var mockIpfs = {
                files: {
                    cat: function(hash, callback) {
                        callback('something went wrong', null);
                    }
                }
            }
            let ipfsService = new IPFSService(mockIpfs);

            return ipfsService
                    .cat('QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKT')
                    .then(() => {
                        return Promise.reject('Expected rejection');
                    })
                    .catch((e) => {
                        return Promise.resolve(e);
                    })
                    .then((err) => {
                        should(err).be.ok;
                    });
        });
    });
});
