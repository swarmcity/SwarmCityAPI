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
let subscription;
let shortCode;

describe('Swarm City API socket client > test subscribe ShortCode', function() {
	let client;
	let socketURL;

	before(function(done) {
		server.listen({
			APISOCKETPORT: 12205,
		}).then((con) => {
			socketURL = 'http://localhost:' + con.port;
			logger.info('connecting to %s', socketURL);
			client = io.connect(socketURL, options);

			done();
		});
	});

	it('should not be able to set the validity of a ShortCode', function(done) {
		let promises = [];
		promises.push(new Promise((resolve, reject) => {
			client.emit('subscribe', {
				channel: 'createShortCode',
				args: {
                    address: process.env.SWTBALANCE,
                    userName: 'me',
                    avatar: 'BASE64',
                    validity: 30 * 1000,
				},
            }, (reply) => {
                should(reply).have.property('response', 200);
                should(reply).have.property('subscriptionId');
                should(reply).have.property('data')
                    .with.a.property('validity');
                should(reply.data.validity).be.equal(120 * 1000);
                client.emit('unsubscribe', {
                    subscriptionId: reply.subscriptionId,
                }, (reply) => {
                    should(reply).have.property('response', 200);
                    resolve();
                });
            });
        }));

		Promise.all(promises).then(() => {
			done();
		}).catch((err) => {
			logger.error(err);
			done();
		});
	});


	it('should subscribe to ShortCode', function(done) {
		let promises = [];
		promises.push(new Promise((resolve, reject) => {
			client.emit('subscribe', {
				channel: 'createShortCode',
				args: {
                    address: process.env.SWTBALANCE,
                    userName: 'me',
                    avatar: 'BASE64',
				},
			}, (reply) => {
                should(reply).have.property('response', 200);
                should(reply).have.property('subscriptionId');
                should(reply).have.property('data')
                    .with.a.property('shortCode');
                should(reply).have.property('data')
                    .with.a.property('validity');
                should(reply.data.validity).be.equal(120 * 1000);
                shortCode = reply.data.shortCode;
                subscription = reply.subscriptionId;
                resolve();
			});
		}));

		Promise.all(promises).then(() => {
			done();
		}).catch((err) => {
			logger.error(err);
			done();
		});
	});

	it('should read the data of the ShortCode', function(done) {
		let promises = [];
		promises.push(new Promise((resolve, reject) => {
			client.emit('readShortCode', {
				shortCode: shortCode,
			}, (reply) => {
				should(reply).have.property('response', 200);
				should(reply).have.property('data')
					.with.a.property('address', process.env.SWTBALANCE);
				should(reply).have.property('data')
					.with.a.property('avatar', 'BASE64');
				should(reply).have.property('data')
					.with.a.property('userName', 'me');
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


	it('should not find the data for a non-existing ShortCode', function(done) {
		let promises = [];
		promises.push(new Promise((resolve, reject) => {
			client.emit('readShortCode', {
				shortCode: 666,
			}, (reply) => {
				should(reply).have.property('response', 400);
				should(reply).not.have.property('data');
				should(reply).have.property('error', 'ShortCode 666 not found.');
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

	it('should wait a few moments', function(done) {
		setTimeout(() => {
			done();
		}, 2 * 1000);
	});

	it('should unsubscribe', (done) => {
		let promises = [];

		promises.push(new Promise((resolve, reject) => {
			client.emit('unsubscribe', {
				subscriptionId: subscription,
			}, (reply) => {
				should(reply).have.property('response', 200);
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

	it('should wait a few moments', function(done) {
		setTimeout(() => {
			done();
		}, 2 * 1000);
	});

	it('after unsubscribing the existing ShortCode should be gone', function(done) {
		let promises = [];
		promises.push(new Promise((resolve, reject) => {
			client.emit('readShortCode', {
				shortCode: shortCode,
			}, (reply) => {
				should(reply).have.property('response', 400);
				should(reply).not.have.property('data');
				should(reply).have.property('error', 'ShortCode ' + shortCode + ' not found.');
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
		client.close(() => {
			logger.info('client closed...');
		});
		server.close().then(() => {
			logger.info('server closed...');
			done();
		});
	});
});
