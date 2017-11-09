'use strict';

const logger = require('../logs')();
const io = require('socket.io-client');

const options = {
	'transports': ['websocket'],
	'force new connection': true,
};

// create a server
const server = require('../socket');

describe('Swarm City API socket client', function() {
	let client;
	let socketURL;

	before(function(done) {
		server.listen().then((con) => {
			socketURL = 'http://localhost:' +
				con.port + '?publicKey=0x7018d8f698bfa076e1bdc916e2c64caddc750944';
			logger.info('socketURL=', socketURL);
			done();
		});
	});

	it('should receive all related events right after socket connects', function(done) {
		logger.info('connecting to ', socketURL);
		client = io.connect(socketURL, options);

		let promises = [];
		promises.push(new Promise((resolve, reject) => {
			client.on('balanceChanged', (data) => {
				logger.info('balanceChanged', data);
				resolve();
			});
		}));
		promises.push(new Promise((resolve, reject) => {
			client.on('fxChanged', (data) => {
				logger.info('fxChanged', data);
				resolve();
			});
		}));
		promises.push(new Promise((resolve, reject) => {
			client.on('gasPriceChanged', (data) => {
				logger.info('gasPriceChanged', data);
				resolve();
			});
		}));
		promises.push(new Promise((resolve, reject) => {
			client.on('hashtagsChanged', (data) => {
				logger.info('hashtagsChanged');
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
