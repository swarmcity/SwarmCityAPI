'use strict';
const should = require('should');
const logger = require('../logs')();

const io = require('socket.io-client');

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
		server.listen().then((con) => {
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
			client.emit('subscribe', {
				channel: 'hashtags',
				args: {
				},
			}, (data) => {
				logger.info('call returned data', data);
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
		client.close(() => {
			logger.info('client closed...');
		});
		server.close().then(() => {
			logger.info('server closed...');
			done();
		});
	});
});
