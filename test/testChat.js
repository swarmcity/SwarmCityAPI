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

describe('Swarm City API socket client', function() {
	let client;
	let socketURL;
	let itemHash = 'itemHash';

	before(function(done) {
		server.listen({
			APISOCKETPORT: 12205,
		}).then((con) => {
			socketURL = 'http://localhost:' + con.port;
			done();
		});
	});

	it('should connect to the client', function(done) {
		logger.info('connecting to %s', socketURL);
		client = io.connect(socketURL, options);
		done();
	});

	it('should subscribe to the chat', function(done) {
		const data = {
			emitterAddress: '0x',
			members: [
				{
					'address': '0x',
					'key': 'Key',
					'role': 'provider',
					'username': 'Goedele Liekens',
					'avatarHash': 'hash',
				},
			],
			itemHash,
		};
		client.emit('subscribeToChat', data, (reply) => {
			should(reply.data.key).equal('Key');
			done();
		});

        // client.emit('ping', function(res) {
        //     console.log('Ping result: '+res);
        // });
	});

	it('should send new message', function(done) {
		const data = {
			itemHash,
			payload: {
				message: 'encrypted message',
				avatarHash: 'hash',
				username: 'username',
				sender: '0x',
			},
		};
		client.on('chatChanged', (reply) => {
			let lastMessage = reply.messages[reply.messages.length - 1];
			should(lastMessage.message).equal('encrypted message');
			done();
		});
		client.emit('newChatMessage', data, (reply) => {
			should(reply).equal(200);
		});

        // client.emit('ping', function(res) {
        //     console.log('Ping result: '+res);
        // });
	});

	after(function(done) {
		logger.info('closing server and client socket...');
		client.close(() => {
			logger.info('client closed');
		});
		server.close().then(() => {
			logger.info('server closed');
			done();
		});
	});
});
