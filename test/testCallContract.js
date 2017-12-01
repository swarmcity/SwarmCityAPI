'use strict';
const should = require('should');
const logger = require('../logs')('Mocha test');

const io = require('socket.io-client');

const tokenABI = require('../contracts/miniMeToken.json');

const options = {
	'transports': ['websocket'],
	'force new connection': true,
};

// create a server
const server = require('../socket');

describe('Swarm City API socket client > test callContract', function() {
	let client;
	let socketURL;

	before(function(done) {
		server.listen({
			APISOCKETPORT: 12205,
		}).then((con) => {
			socketURL = 'http://localhost:' + con.port;
			logger.info('socketURL=', socketURL);
			done();
		});
	});

	it('should connect and call callContract', function(done) {
		logger.info('connecting to ', socketURL);
		client = io.connect(socketURL, options);

		let promises = [];
		promises.push(new Promise((resolve, reject) => {
			client.emit('callContract', {
				address: '0xb9e7f8568e08d5659f5d29c4997173d84cdf2607',
				abi: tokenABI.abi,
				method: 'creationBlock',
				arguments: null,
			}, (data) => {
				logger.info('callContract returned', data);
				should(data).have.property('response', 200);
				resolve();
			});
		}));

		promises.push(new Promise((resolve, reject) => {
			client.emit('callContract', {
				address: '0xb9e7f8568e08d5659f5d29c4997173d84cdf2607',
				abi: tokenABI.abi,
				method: 'balanceOf',
				arguments: ['0x7018d8f698bfa076e1bdc916e2c64caddc750944'],
			}, (data) => {
				logger.info('callContract returned', data);
				should(data).have.property('response', 200);
				resolve();
			});
		}));

		promises.push(new Promise((resolve, reject) => {
			client.emit('callContract', {
				address: '0xb9e7f8568e08d5659f5d29c4997173d84cdf2607',
				abi: tokenABI.abi,
				method: 'balanceOf',
				arguments: ['0x0'],
			}, (data) => {
				logger.info('callContract returned', data);
				should(data).have.property('response', 200);
				resolve();
			});
		}));
		Promise.all(promises).then(() => {
			done();
		}).catch((err) => {
			logger.info(err);
			done();
		});
	});

	after(function(done) {
		logger.info('closing client socket');
		client.close();
		server.close().then(() => {
			logger.info('server closed...');
			done();
		});
	});
});
