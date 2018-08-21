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

describe.skip('Swarm City API socket client > test subscribe hashtags', function() {
	let client;
	let socketURL;

	before(function(done) {
		server.listen({
			APISOCKETPORT: 12205,
		}).then((con) => {
			socketURL = 'http://localhost:' + con.port;
			done();
		});
	});

	it('should subscribe to hashtags', function(done) {
		logger.info('connecting to %s', socketURL);
		client = io.connect(socketURL, options);

		let promises = [];
		promises.push(new Promise((resolve, reject) => {
			client.emit('subscribe', {
				channel: 'hashtags',
				args: {},
			}, (data) => {
				logger.info('call returned data %j', data);
				should(data).have.property('response', 200);
				subscription = data.subscriptionId;
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

	it('should receive update to hashtags', function(done) {
		let promises = [];
		promises.push(new Promise((resolve, reject) => {
			client.on('hashtagsChanged', (data) => {
				should(data).have.property('response', 200);
				should(data).have.property('subscriptionId', subscription);
				should(data).have.property('data');
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

	it('should unsubscribe', (done) => {
		let promises = [];
		logger.info('unsubscribe from %s', subscription);
		promises.push(new Promise((resolve, reject) => {
			client.emit('unsubscribe', {
				subscriptionId: subscription,
			}, (data) => {
				should(data).have.property('response', 200);
				logger.info('unsubscribe>>> %j', data);
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
