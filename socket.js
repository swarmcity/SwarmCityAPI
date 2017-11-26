require('./environment');
const app = require('express')();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const logs = require('./logs')('socketServer');
const validate = require('./validators');

const scheduledTask = require('./scheduler/scheduledTask')();
const blockHeaderTask = require('./scheduler/blockHeaderTask')();

// scheduled task handlers
const getFx = require('./tasks/getFx')();
const getGasPrice = require('./tasks/getGasPrice')();

// socket task handlers
const getBalance = require('./tasks/getBalance')();

// subscription handler
const subscriptions = require('./subscriptions')();

// functions handler
const functions = require('./functions')();


let connectedSockets = {};

(() => {
	// schedule getFx task every minute
	scheduledTask.addTask({
		func: getFx.updateFx,
		interval: 60 * 1000,
	});
})();

io.on('connection', (socket) => {
	logs.info('socket', socket.id, 'connected');

	let client = {
		socket: socket,
	};

	connectedSockets[socket.id] = client;

	// if user provided a pubkey , register getBalance tasks
	if (validate.isAddress(socket.handshake.query.publicKey)) {
		logs.info('publicKey provided:', socket.handshake.query.publicKey);
		scheduledTask.addTask({
			name: 'get initial balance', // a task name is optional
			func: (task) => {
				return getBalance.getBalance(task.data);
			},
			responsehandler: (res, task) => {
				logs.info('received getBalance RES=', JSON.stringify(res, null, 4));
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
			logs.info('received getFx RES=', JSON.stringify(res, null, 4));
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
			logs.info('received getGasPrice RES=', JSON.stringify(res, null, 4));
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
		logs.info('socket', socket.id, 'disconnected');
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
});

const APISOCKETPORT = process.env.APISOCKETPORT;
const APIHOST = process.env.APIHOST || '0.0.0.0';
/**
 * start the socket server and start listening
 *
 * @return     {Promise}  { resolves with { port , host} when listening }
 */
function listen() {
	return new Promise((resolve, reject) => {
		logs.info('opening WS API on', APIHOST, 'port', APISOCKETPORT);
		if (!APISOCKETPORT || !APIHOST) {
			reject('no APISOCKETPORT defined in environment');
		} else {
			server.listen(APISOCKETPORT, APIHOST, (err) => {
				if (err) {
					reject(err);
				} else {
					logs.info('server listening on host ', APIHOST, 'port', APISOCKETPORT);
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
