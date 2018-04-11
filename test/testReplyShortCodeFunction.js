'use strict';
const should = require('should');
const logger = require('../src/logs')(module);

const io = require('socket.io-client');

const options = {
	transports: ['websocket', 'xhr-polling'],
	path: '/api',
};

// create a server
const server = require('../src/socket');

const dbService = require('../src/services').dbService;


describe('Swarm City API socket client > test replyShortCode', function() {
	let client;
	let socketURL;

	before(function(done) {
		server.listen({
			APISOCKETPORT: 12205,
		}).then((con) => {
			socketURL = 'http://localhost:' + con.port;
		});
		dbService.saveDataToShortCode(
			'TEST1',
			(36000 * 1000),
			'PAYLOAD1'
		).then(() => {
			done();
		});
	});

	it('should connect and fail when call replyShortCode with a non existing shortcode',
		function(done) {
			logger.info('connecting to %s', socketURL);
			client = io.connect(socketURL, options);

			let promises = [];
			promises.push(new Promise((resolve, reject) => {
				client.emit('replyShortCode', {
					shortCode: 'TEST3',
					tx: '0xf889808609184e72a00082271094000000000000000000000000000000000000000080a47f74657374320000000000000000000000000000000000000000000000000000006000571ca08a8bbf888cfa37bbf0bb965423625641fc956967b81d12e23709cead01446075a01ce999b56a8a88504be365442ea61239198e23d1fce7d00fcfc5cd3b44b7215f', // eslint-disable-line
				}, (reply) => {
					logger.info('replyShortCode returned', reply);
					should(reply).have.property('response', 500);
					should(reply).have.property('data',
						'Key not found in database [shortcode-TEST3]');
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


	it('should connect and call replyShortCode', function(done) {
		logger.info('connecting to %s', socketURL);
		client = io.connect(socketURL, options);

		let promises = [];
		promises.push(new Promise((resolve, reject) => {
			client.emit('replyShortCode', {
				shortCode: 'TEST1',
				tx: '0xf889808609184e72a00082271094000000000000000000000000000000000000000080a47f74657374320000000000000000000000000000000000000000000000000000006000571ca08a8bbf888cfa37bbf0bb965423625641fc956967b81d12e23709cead01446075a01ce999b56a8a88504be365442ea61239198e23d1fce7d00fcfc5cd3b44b7215f', // eslint-disable-line
			}, (reply) => {
				logger.info('replyShortCode returned', reply);
				should(reply).have.property('response', 500);
				should(reply).have.property('data',
					'Transaction error: Error: Returned error: nonce too low');
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
