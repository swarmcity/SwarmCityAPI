'use strict';

const subscribeToChatFactory = require('./subscribeToChatFactory');
const newChatMessageFactory = require('./newChatMessageFactory');
const subscribeToHashtagFactory = require('./subscribeToHashtagFactory');
const subscribeToHashtagsFactory = require('./subscribeToHashtagsFactory');

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
		const subscribeToHashtag = subscribeToHashtagFactory(db, socket);
		socket.on('subscribeToHashtag', wrapHandler(subscribeToHashtag));

		const subscribeToHashtags = subscribeToHashtagsFactory(db, socket);
		socket.on('subscribeToHashtags', wrapHandler(subscribeToHashtags));

		const subscribeToChat = subscribeToChatFactory(db, socket);
		socket.on('subscribeToChat', wrapHandler(subscribeToChat));

		const newChatMessage = newChatMessageFactory(db, io);
		socket.on('newChatMessage', wrapHandler(newChatMessage));

		// For debugging purposes with a dedicated website
		const getAllDb = async () => {
			socket.join('allDb');
			const allDb = await db.getAll();
			return allDb;
		};
		socket.on('getAllDb', wrapHandler(getAllDb));
	};

	const disconect = (socket) => {

	};

	return {
		connect,
		disconect,
	};
}

module.exports = subscriptionsLight;
