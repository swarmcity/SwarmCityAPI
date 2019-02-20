'use strict';

const subscribeToChatFactory = require('./subscribeToChatFactory');
const newChatMessageFactory = require('./newChatMessageFactory');
const idToShortcodeFactory = require('./idToShortcodeFactory');
const shortcodeToIdFactory = require('./shortcodeToIdFactory');

// Functionality to implement:
// - Make sure sockets unsubscribe when they disconect (memory leak), DONE
// - Implement an automatic registration of procedures by event name, NAH
// - Check if you can get list of sockets subscribed to a room

const wrapHandler = (handler) => async (data, callback) => {
	try {
		callback({
			response: 200,
			data: await handler(data) || {},
		});
	} catch (e) {
		callback({
			response: 500,
			message: e.message,
			stack: e.stack,
		});
	}
};

/**
 * subscribe a socket from all subscriptions
 *
 * @param      {Object}  db  The socket identifier
 * @param      {Object}  io  The socket identifier
 * @return      {Object}  methods  The socket identifier
 */
function subscriptionsLight(db, io) {
	const connect = (socket) => {
		const subscribeToChat = subscribeToChatFactory(db, socket);
		socket.on('subscribeToChat', wrapHandler(subscribeToChat));

		const newChatMessage = newChatMessageFactory(db, io);
		socket.on('newChatMessage', wrapHandler(newChatMessage));

		// Shortcode new handlers
		const idToShortcode = idToShortcodeFactory(db, socket);
		socket.on('idToShortcode', wrapHandler(idToShortcode));

		const shortcodeToId = shortcodeToIdFactory(db, socket);
		socket.on('shortcodeToId', wrapHandler(shortcodeToId));

		// For debugging purposes with a dedicated website
		const getAllDb = async () => await db.getAll();
		socket.on('getAllDb', wrapHandler(getAllDb));

		const joinDebug = async () => {
			socket.join('debug');
		};
		socket.on('joinDebug', wrapHandler(joinDebug));

		const getRooms = async () => io.sockets.adapter.rooms;
		socket.on('getRooms', wrapHandler(getRooms));
	};

	const disconect = (socket) => {

	};

	return {
		connect,
		disconect,
	};
}

module.exports = subscriptionsLight;
