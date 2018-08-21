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

describe('Swarm City API socket client > test pubsub on \'txhistory\'', function() {
	let client;
	let subscriptions = [];

	let socketURL;


	before(function(done) {
		server.listen({
			APISOCKETPORT: 12205,
		}).then((con) => {
			socketURL = 'http://localhost:' + con.port;
			done();
		});
	});

	it('should subscribe / receive a subscription ID', function(done) {
		logger.info('connecting to %s', socketURL);
		client = io.connect(socketURL, options);


				client.emit('subscribe', {
					channel: 'txHistory',
					args: {
						address: process.env.SWTBALANCE,
					},
				}, (data) => {
					should(data).have.property('response', 200);
					should(data).have.property('subscriptionId');

					subscriptions.push(data.subscriptionId);

					logger.info('subscribe>>>txhistory %j', data);
					done();
				});
    });

    it('should wait a while for a block', (done) => {
        // listen to updates....
        client.on('txHistoryChanged', (data) => {
            logger.info('txHistoryChanged');
            logger.info('received txhistory update...', data);
        });

        setTimeout(() => {
            done();
        }, 1900);
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
					logger.info('unsubscribe>>>%j', data);
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
