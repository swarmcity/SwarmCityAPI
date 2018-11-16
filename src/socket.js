require('./environment');
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    path: '/api',
    transports: ['websocket', 'xhr-polling'],
});
const logs = require('./logs')(module);
const eventBus = require('./eventBus');

const dbService = require('./services').dbService;

// subscription handler
const subscriptionsLightFactory = require('./subscriptionsLight');
const subscriptionsLight = subscriptionsLightFactory(dbService, io);

io.on('connection', (socket) => {
	logs.info('socket %s connected', socket.id);

	// execute subscriptions light
	subscriptionsLight.connect(socket);
});

// Receibe dbChanges
eventBus.on('dbChange', (key, data) => {
	io.to('debug').emit('dbChange', key, data);
	// const keys = parseKey(key);
	// hashtagItem changed
	if (key.startsWith('item-')) {
		const hashtagAddress = key.split('-')[1];
		io.to('hashtag-'+hashtagAddress).emit('hashtagItemsChanged', {
			response: 200,
			data: [data],
		});
		// logs.info('SOCKET.IO to(\'hashtag-'+hashtagAddress+'\').emit(\'hashtagItemsChanged\')');
	}
	// hashtag changed
	else if (key.startsWith('hashtag-')) {
		const hashtagAddress = key.split('-')[1];
		io.to('hashtag-'+hashtagAddress).emit('hashtagsChanged', {
			response: 200,
			data: [data],
		});
		// logs.info('SOCKET.IO to(\'hashtag-'+hashtagAddress+'\').emit(\'hashtagsChanged\')');
	}
});

/**
 * start the socket server and start listening
 *
 * @param      {Object}   customConfig cstom config that overrides env
 *
 * @return     {Promise}  resolves with { port , host} when listening
 */
function listen(customConfig) {
	if (!customConfig) {
		customConfig = {};
	}

	const APISOCKETPORT = customConfig.APISOCKETPORT || process.env.APISOCKETPORT || 2205;
	const APIHOST = customConfig.APIHOST || process.env.APIHOST || '0.0.0.0';

	return new Promise((resolve, reject) => {
		logs.info('opening WS API on %s:%i', APIHOST, APISOCKETPORT);
		if (!APISOCKETPORT || !APIHOST) {
			reject('no APISOCKETPORT defined in environment');
		} else {
			server.listen(APISOCKETPORT, APIHOST, (err) => {
				if (err) {
					reject(err);
				} else {
					logs.info('server listening on %s:%i', APIHOST, APISOCKETPORT);
					resolve({
						port: APISOCKETPORT,
						host: APIHOST,
					});
				}
			});
		}
	});
}

/**
 * stop listening for new connections
 *
 * @return     {Promise}  { description_of_the_return_value }
 */
function close() {
	return new Promise((resolve, reject) => {
		server.close((err) => {
			if (err) reject(err);
			else resolve();
		});
	});
}

module.exports = {
	listen: listen,
	close: close,
};
