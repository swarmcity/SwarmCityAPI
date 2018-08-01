'use strict';
const should = require('should');
const {promisify} = require('utils');
const logger = require('../src/logs')(module);
const ioClient = require('socket.io-client');
const app = require('express')();
const server = require('http').createServer(app);
const ioServer = require('socket.io')(server, {
    path: '/api',
    transports: ['websocket', 'xhr-polling'],
});

const options = {
	transports: ['websocket', 'xhr-polling'],
	path: '/api',
};

describe('Swarm City API socket client', function() {
	let client;
	let socketURL;

	before(function(done) {
		server.listen({

		}).then((con) => {
			socketURL = 'http://localhost:' + con.port;
			done();
		});
    });

    const APISOCKETPORT = 12205;
    const APIHOST =
    promisify(server.listen)(APISOCKETPORT, APIHOST);

	it('should call ping', function(done) {
		logger.info('connecting to %s', socketURL);
        client = io.connect(socketURL, options);
        console.log(client);

        // client.emit('ping', function(res) {
        //     console.log('Ping result: '+res);
        // });
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
