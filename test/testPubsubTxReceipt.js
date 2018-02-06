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

describe('Swarm City API socket client > test pubsub on \'txReceipt\'', function() {
	let client;
	let subscriptions = [];

	let socketURL;


	before(function(done) {
		server.listen({
			APISOCKETPORT: 12205,
		}).then((con) => {
			socketURL = 'http://localhost:' +
				con.port;
			done();
		});
	});

	it('should subscribe / receive a subscription ID', function(done) {
		logger.info('connecting to %s', socketURL);
		client = io.connect(socketURL, options);

		let promises = [];
		for (let i = 0; i < 1; i++) {
			promises.push(new Promise((resolve, reject) => {
				client.emit('subscribe', {
					channel: 'txReceipt',
					args: {
						transactionHash: '0xd0de9990016fbcb329d87c3f50344f3cb041edcee1968ca9965bb2e419e4e5c6',
					},
				}, (reply) => {
					should(reply).have.property('response', 200);
					should(reply).have.property('subscriptionId');

					// check the format of a ERC-20 balance
					// which should have a contractAddress
					should(reply).have.property('data')
						.with.a.property('receipt');
					should(reply).have.property('data')
						.with.a.property('status');

					subscriptions.push(reply.subscriptionId);

					logger.info('subscribe>>>balance', reply);
					resolve();
				});
			}));

			promises.push(new Promise((resolve, reject) => {
				client.emit('subscribe', {
					channel: 'txReceipt',
					args: {
						transactionHash: '0x96eb16467e45bcc37c5286712c25434f248e8e09dfca323808f75dc388fd970c',
					},
				}, (reply) => {
					should(reply).have.property('response', 200);
					should(reply).have.property('subscriptionId');

					// check the format of a ERC-20 balance
					// which should have a contractAddress
					should(reply).have.property('data')
						.with.a.property('receipt');
					should(reply).have.property('data')
						.with.a.property('status');

					subscriptions.push(reply.subscriptionId);

					logger.info('subscribe>>>balance', reply);
					resolve();
				});
			}));
		}

		Promise.all(promises).then(() => {
			done();
		}).catch((err) => {
			logger.info(err);
			done();
		});
	});

	it('should wait a while for a block', (done) => {
		// listen to updates....
        // but these won't come anyway
		client.on('txReceiptChanged', (data) => {
            logger.info('txReceiptChanged');
            logger.info('received txReceipt update...', data);
        });

        setTimeout(() => {
            done();
        }, 25 * 1000);
	});

	it('should unsubscribe / receive a confirmation', (done) => {
		let promises = [];
		subscriptions.forEach((subscription) => {
			logger.info('unsubscribe from %s', subscription);
			promises.push(new Promise((resolve, reject) => {
				client.emit('unsubscribe', {
					subscriptionId: subscription,
				}, (data) => {
					should(data).have.property('response', 200);
					logger.info('unsubscribe>>>', data);
					resolve();
				});
			}));
		});

		Promise.all(promises).then(() => {
			done();
		}).catch((err) => {
			logger.info(err);
			done();
		});
	});

	after(function(done) {
		logger.info('closing client socket');
		client.close(() => {
			logger.info('client closed...');
		});
		server.close().then(() => {
			logger.info('server closed...');
			done();
		});
	});
});
