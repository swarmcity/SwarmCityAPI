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

describe('Swarm City API socket client > test sendRawTx', function() {
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

	it('should connect and call sendRawTx', function(done) {
		logger.info('connecting to %s', socketURL);
		client = io.connect(socketURL, options);

		let promises = [];
		promises.push(new Promise((resolve, reject) => {
			client.emit('sendRawTx', {
				tx: '0xf889808609184e72a00082271094000000000000000000000000000000000000000080a47f74657374320000000000000000000000000000000000000000000000000000006000571ca08a8bbf888cfa37bbf0bb965423625641fc956967b81d12e23709cead01446075a01ce999b56a8a88504be365442ea61239198e23d1fce7d00fcfc5cd3b44b7215f', // eslint-disable-line
			}, (reply) => {
				logger.info('sendRawTx returned', reply);
				should(reply).have.property('response', 500);
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

	after(function(done) {
		logger.info('closing client socket');
		client.close();
		server.close().then(() => {
			logger.info('server closed...');
			done();
		});
	});
});
