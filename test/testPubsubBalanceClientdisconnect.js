'use strict';
const should = require('should');
const logger = require('../logs')();

const io = require('socket.io-client');
// const socketWildcard = require('socketio-wildcard')();
// var patch = require('socketio-wildcard')(io.Manager);

const options = {
	'transports': ['websocket'],
	'force new connection': true,
};

// create a server
const server = require('../socket');


describe('Swarm City API socket client > test client disconnect', function() {
	let client;
	let subscriptions = [];

	let socketURL;

	before(function(done) {
		server.listen().then((con) => {
			socketURL = 'http://localhost:' +
				con.port + '?publicKey=0x7018d8f698bfa076e1bdc916e2c64caddc750944';
			logger.info('socketURL=', socketURL);
			done();
		});
	});

	it('should subscribe / receive a subscription ID', function(done) {
		logger.info('connecting to ', socketURL);
		client = io.connect(socketURL, options);

		let promises = [];
		for (let i = 0; i < 3; i++) {
			promises.push(new Promise((resolve, reject) => {
				client.emit('subscribe', {
					channel: 'balance',
					args: {
						address: '0x7018d8f698bfa076e1bdc916e2c64caddc750944',
					},
				}, (data) => {
					should(data).have.property('response', 200);
					should(data).have.property('subscriptionId');

					subscriptions.push(data.subscriptionId);

					logger.info('subscribe>>>balance', data);
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

	it('should handle client disconnects', function(done) {
		client.close();
		done();
	});

	after(function(done) {
		server.close().then(() => {
			logger.info('server closed...');
			done();
		});
	});
});
