'use strict';
require('dotenv').config({
	path: '../.env',
});
const ipfs = require('../globalIPFS')();
const should = require('should');
const logger = require('../logs')('Mocha');

describe('test of globalIPFS', function() {

	let helloworldIPFShash = 'QmeV1kwh3333bsnT6YRfdCRrSgUPngKmAhhTa4RrqYPbKT';

	it('isIPFSHash test', function(done) {
		should(ipfs.isIPFSHash('notanipfshash')).equal(false);
		should(ipfs.isIPFSHash(helloworldIPFShash)).equal(true);
		done();
	});

	it('ipfs.cat test', function(done) {
		ipfs.cat(helloworldIPFShash).then((data) => {
			logger.info('data',data);
			should(data).equal('hello world!');
			done();

		}).catch((e) => {
			done();

		});

	});

	//

	// if (ipfs.isIPFSHash(log.returnValues.value)) {
	// 								ipfs.cat(log.returnValues.value).then((data) => {
	// 									logger.info('found hashtaglist : ', data);

	// 		done();
	// 	});
});
