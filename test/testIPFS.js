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
