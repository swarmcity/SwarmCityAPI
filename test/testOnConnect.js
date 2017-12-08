'use strict';
const should = require('should');
const logger = require('../logs')('Mocha test');
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
		server.listen({
			APISOCKETPORT: 12205,
		}).then((con) => {
			socketURL = 'http://localhost:' +
				con.port;
			logger.info('socketURL=', socketURL);
			done();
		});
	});

	it('should receive all related events right after socket connects', function(done) {
		logger.info('connecting to ', socketURL);
		client = io.connect(socketURL, options);

		let promises = [];
		// promises.push(new Promise((resolve, reject) => {
		// 	client.on('balanceChanged', (data) => {
		// 		logger.info('balanceChanged', data);
		// 		resolve();
		// 	});
		// }));
		promises.push(new Promise((resolve, reject) => {
			client.on('fxChanged', (reply) => {
				logger.info('fxChanged', reply);
				should(reply).have.property('symbol', 'swt');
				should(reply).have.property('priceBtc');
				should(reply).have.property('priceEur');
				should(reply).have.property('priceUsd');
				resolve();
			});
		}));
		promises.push(new Promise((resolve, reject) => {
			client.on('gasPriceChanged', (data) => {
				logger.info('gasPriceChanged', data);
				resolve();
			});
		}));
		// promises.push(new Promise((resolve, reject) => {
		// 	client.on('hashtagsChanged', (data) => {
		// 		logger.info('hashtagsChanged');
		// 		resolve();
		// 	});
		// }));
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
