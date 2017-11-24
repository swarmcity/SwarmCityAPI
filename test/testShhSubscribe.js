'use strict';
const should = require('should');
const logger = require('../logs')();

const io = require('socket.io-client');
const subscriptions = require('../subscriptions')();


const options = {
	'transports': ['websocket'],
	'force new connection': true,
};

// create a server
const server = require('../socket');

describe('Swarm City API socket client > test pubsub on \'shhsubscribe\'', function() {
	let client;
	let subscriptionsArray = [];

	let socketURL;


	before(function(done) {
		server.listen().then((con) => {
			socketURL = 'http://localhost:' +
				con.port;
			logger.info('socketURL=', socketURL);
			done();
		});
	});

	it('should subscribe / receive a subscription ID', function(done) {
		logger.info('connecting to ', socketURL);
		client = io.connect(socketURL, options);

		let promises = [];
		for (let i = 0; i < 1; i++) {
			promises.push(new Promise((resolve, reject) => {
				client.emit('subscribe', {
					channel: 'shhsubscribe',
					args: {
						address: '0x7018d8f698bfa076e1bdc916e2c64caddc750944',
						mode: 'shortcode',
					},
				}, (data) => {
					should(data).have.property('response', 200);
					should(data).have.property('subscriptionId');

					subscriptionsArray.push(data.subscriptionId);

					logger.info('subscribe>>>', data);
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

	it('should list subscriptions', (done) => {
		subscriptions.status().then(done);
	});

	it('should unsubscribe / receive a confirmation', (done) => {
		let promises = [];
		subscriptionsArray.forEach((subscription) => {
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
