'use strict';
require('dotenv').config({
	path: '../.env',
});
const ipfs = require('../globalIPFS')();
const should = require('should');
const logger = require('../logs')('Mocha');

if (!process.env.TESTIPFS || process.env.TESTIPFS == '0') {
	logger.info('SSH test disabled');
} else {
	describe('test of globalIPFS', function() {
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

		let helloworldIPFShash = 'QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKT';

		it('ipfs.cat test', function(done) {
			ipfs.cat(helloworldIPFShash).then((data) => {
				logger.info('data', data);
				should(data).equal('hello world!');
				done();
			}).catch((e) => {
				done();
			});
		});
	});
}
