'use strict';
const should = require('should');
const logger = require('../logs')('testPubSubHashtags');

const io = require('socket.io-client');

const options = {
	'transports': ['websocket'],
	'force new connection': true,
};

// create a server
const server = require('../socket');
let subscriptions = [];

describe('Swarm City API socket client > test subscribe hashtags', function() {
	let client;
	let socketURL;

	before(function(done) {
		server.listen().then((con) => {
			socketURL = 'http://localhost:' + con.port;
			logger.info('socketURL=', socketURL);
			done();
		});
	});

	it('should subscribe to hashtags', function(done) {
		logger.info('connecting to ', socketURL);
		client = io.connect(socketURL, options);

		let promises = [];
		promises.push(new Promise((resolve, reject) => {
			client.emit('subscribe', {
				channel: 'hashtags',
				args: {},
			}, (data) => {
				logger.info('call returned data', data);
				should(data).have.property('response', 200);
				subscriptions.push(data.subscriptionId);
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
		subscriptions.forEach((subscription) => {
			logger.info('unsubscribe from', subscription);
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
