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
let shortcode;

describe('Swarm City API socket client > test subscribe shortcode', function() {
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


	it('should subscribe to shortcode', function(done) {
		let promises = [];
		promises.push(new Promise((resolve, reject) => {
			client.emit('subscribe', {
				channel: 'shortcode',
				args: {
					validity: 1000,
					payload: {
						hello: 'world',
					},
				},
			}, (reply) => {
				should(reply).have.property('response', 200);
				should(reply).have.property('subscriptionId');
				should(reply).have.property('data').with.a.property('shortcode');
				shortcode = reply.data.shortcode;
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

	it('should read the data of the shortcode', function(done) {
		let promises = [];
		promises.push(new Promise((resolve, reject) => {
			client.emit('readShortCode', {
				shortcode: shortcode,
			}, (reply) => {
				should(reply).have.property('response', 200);
				should(reply).have.property('data')
					.with.a.property('payload')
					.with.a.property('hello', 'world');
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


	it('should not find the data non-existing shortcode', function(done) {
		let promises = [];
		promises.push(new Promise((resolve, reject) => {
			client.emit('readShortCode', {
				shortcode: 666,
			}, (reply) => {
				should(reply).have.property('response', 400);
				should(reply).not.have.property('data');
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

	it('should receive update to shortcode', function(done) {
		let promises = [];
		promises.push(new Promise((resolve, reject) => {
			client.on('shortcodeChanged', (reply) => {
				should(reply).have.property('response', 200);
				should(reply).have.property('subscriptionId', subscription);
				should(reply).have.property('data');
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
