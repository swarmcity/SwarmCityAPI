'use strict';
const should = require('should');
const logger = require('../src/logs')(module);

const io = require('socket.io-client');

const options = {
	transports: ['websocket', 'xhr-polling'],
	path: '/api',
};


describe('Swarm City API socket client > test ipfsAdd', function() {
	let client;
    let server;
	let socketURL;

	before(function(done) {
        if (process.env.TESTIPFS && process.env.TESTIPFS == '1') {
            // create a server
            server = require('../src/socket');
            server.listen({
                APISOCKETPORT: 12205,
            }).then((con) => {
                socketURL = 'http://localhost:' + con.port;
                done();
            });
        } else {
            this.skip();
        }
	});
	it('should connect', function(done) {
		logger.info('connecting to %s', socketURL);
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

	it('should call ipfsAdd with base64 encoding', function(done) {
		client.emit('ipfsAdd', {
			payload: 'VGVzdGluZyBzdHJpbmc=',
		}, (reply) => {
			should(reply).have.property('response', 200);
			should(reply).have.property('data').and.be.a.String();
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
