require('./environment');
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server, {
    path: '/api',
    transports: ['websocket', 'xhr-polling'],
});
const logs = require('./logs')(module);
const validate = require('./validators');
const eventBus = require('./eventBus');

const scheduledTask = require('./scheduler/scheduledTask')();
const blockHeaderTask = require('./scheduler/blockHeaderTask')();
const dbService = require('./services').dbService;
const web3 = require('./globalWeb3').web3;

// scheduled task handlers
const getFx = require('./tasks/getFx')();
const getGasPrice = require('./tasks/getGasPrice')();

// socket task handlers
const getBalance = require('./tasks/getBalance')();

// subscription handler
const subscriptions = require('./subscriptions')();

// subscription handler
const subscriptionsLightFactory = require('./subscriptionsLight');
const subscriptionsLight = subscriptionsLightFactory(dbService, web3, io);

// functions handler
const functions = require('./functions');


let connectedSockets = {};

(() => {
	// schedule getFx task every minute
	scheduledTask.addTask({
		func: getFx.updateFx,
		interval: 60 * 1000,
	});
})();

io.on('connection', (socket) => {
	logs.info('socket %s connected', socket.id);

	let client = {
		socket: socket,
	};

	connectedSockets[socket.id] = client;

	// if user provided a pubkey , register getBalance tasks
	if (validate.isAddress(socket.handshake.query.publicKey)) {
		logs.info('publicKey provided: %s', socket.handshake.query.publicKey);
		scheduledTask.addTask({
			name: 'get initial balance', // a task name is optional
			func: (task) => {
				return getBalance.getBalance(task.data);
			},
			responsehandler: (res, task) => {
				// logs.info('received getBalance RES=%j', res);
				task.data.socket.emit('balanceChanged', res);
			},
			data: {
				socket: socket,
				address: socket.handshake.query.publicKey,
			},
		});
	}

	scheduledTask.addTask({
		name: 'getFX',
		func: (task) => {
			return getFx.getFx();
		},
		responsehandler: (res, task) => {
			// logs.info('received getFx RES=%j', res);
			task.data.socket.emit('fxChanged', res);
		},
		data: {
			socket: socket,
			address: socket.handshake.query.publicKey,
		},
	});

	scheduledTask.addTask({
		name: 'get gasprice',
		func: (task) => {
			return getGasPrice.getGasPrice();
		},
		responsehandler: (res, task) => {
			// logs.info('received getGasPrice RES=%j', res);
			task.data.socket.emit('gasPriceChanged', res);
		},
		data: {
			socket: socket,
			address: socket.handshake.query.publicKey,
		},
	});

	// scheduledTask.addTask({
	// 	name: 'get hashtags',
	// 	func: (task) => {
	// 		return getHashtags.getHashtags();
	// 	},
	// 	responsehandler: (res, task) => {
	// 		logs.info('received getHashtags RES=', JSON.stringify(res, null, 4));
	// 		task.data.socket.emit('hashtagsChanged', res);
	// 	},
	// 	data: {
	// 		socket: socket,
	// 		address: socket.handshake.query.publicKey,
	// 	},
	// });

	socket.on('disconnect', () => {
		logs.info('socket %s disconnected', socket.id);
		subscriptions.unsubscribeAll(socket.id);
	});

	// handle subscribe
	socket.on('subscribe', (data, callback) => {
		subscriptions.subscribe(socket, data, callback);
	});

	// handle unsubscribe
	socket.on('unsubscribe', (data, callback) => {
		subscriptions.unsubscribe(socket, data, callback);
	});

	// register all verbs for functions
	functions.registerHandlers(socket);

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
		logs.info('SOCKET.IO to(\'hashtag-'+hashtagAddress+'\').emit(\'hashtagItemsChanged\')');
	}
	// hashtag changed
	else if (key.startsWith('hashtag-')) {
		const hashtagAddress = key.split('-')[1];
		io.to('hashtag-'+hashtagAddress).emit('hashtagsChanged', {
			response: 200,
			data: [data],
		});
		logs.info('SOCKET.IO to(\'hashtag-'+hashtagAddress+'\').emit(\'hashtagsChanged\')');
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
		scheduledTask.removeAllTasks();
		blockHeaderTask.removeAllTasks();
		server.close((err) => {
			if (err) {
				reject(err);
			} else {
				resolve();
			}
		});
	});
}

module.exports = {
	listen: listen,
	close: close,
};
