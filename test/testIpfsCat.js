'use strict';
const should = require('should');
const logger = require('../src/logs')(module);

const io = require('socket.io-client');

const options = {
	transports: ['websocket', 'xhr-polling'],
	path: '/api',
};


describe('Swarm City API socket client > test ipfsCat', function() {
	let client;
    let server;
	let socketURL;

	before(function(done) {
        if (process.env.TESTIPFS && process.env.TESTIPFS == '1') {
            // create a server
            server = require('../socket');
            server.listen({
                APISOCKETPORT: 12205,
            }).then((con) => {
                socketURL = 'http://localhost:' + con.port;
                logger.info('socketURL=', socketURL);
                done();
            });
        } else {
            this.skip();
        }
	});
	it('should connect', function(done) {
		logger.info('connecting to ', socketURL);
		client = io.connect(socketURL, options);
		client.on('connect', function() {
			done();
		});
		client.on('connect_error', function() {
			logger.info('Connection failed');
			done();
		});
		client.on('reconnect_failed', function() {
			logger.info('Reconnection failed');
			done();
		});
	});

	it('should call ipfsCat with base64 encoding', function(done) {
		client.emit('ipfscat', {
			hash: 'QmXxr6WpiGhDD83P5DdjyEXAxbxmNZg6CZ3Gsh3ARuAvc2',
			format: 'base64',
		}, (reply) => {
			should(reply).have.property('response', 200);
			should(reply).have.property('data').and.be.a.String();
			done();
		});
	});

	it('should fail on invalid hash when calling ipfsCat', function(done) {
		client.emit('ipfscat', {
			hash: 'QUAAK',
			format: 'base64',
		}, (reply) => {
			should(reply).have.property('response', 500);
			done();
		});
	});

	it('unknown return format should default to Buffer when calling ipfsCat', function(done) {
		client.emit('ipfscat', {
			hash: 'QmXxr6WpiGhDD83P5DdjyEXAxbxmNZg6CZ3Gsh3ARuAvc2',
			format: 'unknown',
		}, (reply) => {
			should(reply).have.property('response', 200);
			should(reply).have.property('data').and.be.type('object');
			done();
		});
	});
	after(function(done) {
        if (process.env.TESTIPFS && process.env.TESTIPFS == '1') {
            logger.info('closing client socket');
            client.close();
            server.close().then(() => {
                logger.info('server closed...');
                done();
            });
        } else {
            done();
        }
	});
});
