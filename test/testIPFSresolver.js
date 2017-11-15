'use strict';
const should = require('should');
const logger = require('../logs')();

const resolveIPFS = require('../tasks/resolveIPFS');

describe('Swarm City API ', function() {
	

	it('should resolve IPFS hashes', function(done) {
		
		let promises = [];
		promises.push(resolveIPFS().resolveIPFS("QmciGaMnHLqxCYc7TKSCoDnsSzL4G3fWDnWQHdaeMWfW4q").then((data)=>{
			console.log('data=',data);
		}));

		Promise.all(promises).then(() => {
			done();
		}).catch((err) => {
			logger.info(err);
			done();
		});
	});

});
