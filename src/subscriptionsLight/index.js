'use strict';

// Functionality to implement:
// - Make sure sockets unsubscribe when they disconect (memory leak)
// - Implement an automatic registration of procedures by event name
// - Check if you can get list of sockets subscribed to a room

const subscribeToChatFactory = (
	db,
	socket
) => async (data) => {
	// 1. Should create the chat object in the database
	// if it doesn't exist, or create it if it exist
	let chatObject = await db.getChat(data.itemHash);

	// 2. Should check if there is a members key,
	// and add those to the chat object
	if (data.members) {
		chatObject = await db.addMembersToChat(data.itemHash, data.members);
	}

	// 3. Should subscribe the emitter to the chat room
	socket.join('chat-'+data.itemHash);

	// 4. Should reply with a success message:
	const emitter = chatObject.members[data.emitterAddress];
	if (!emitter) {
		throw Error('You are not allowed in this chat: '+data.emitterAddress);
	}
	return {
		key: emitter.key,
	};
};

const newChatMessageFactory = (
	db,
	io
) => async (data) => {
	// 1. Should store the message in the database
	// if it doesn't exist, return an error
	let chatObject = await db.addMessageToChat(data.itemHash, data.payload);

	// 2. Should broadcast to everyone in the room, including the sender
	io.in('chat-'+data.itemHash).emit(
		'chatChanged',
		chatObject
	);
};

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
		const subscribeToChat = subscribeToChatFactory(db, socket);
		socket.on('subscribeToChat', wrapHandler(subscribeToChat));
		// {
		// 	emitterAddress: emitter address
		// 	secrets: [
		// 		{
		// 			"address": "0xeba08e7a1d8145b25c78b473fbc35aa24973d908",
		// 			"key": [encrypted] secret,
		// 			"role": "provider",
		// 			"username": "Goedele Liekens",
		// 			"avatarHash": ipfsHash of the base64 image
		// 		}, {
		// 			"address": "0xeba08e7a1d8145b25c78b473fbc35aa24973d908",
		// 			"key": [encrypted] secret,
		// 			"role": "seeker",
		// 			"username": "Kars Rhyder",
		// 			"avatarHash": ipfsHash of the base64 image
		// 		}
		// 	],
		// 	itemHash: this.hashtagItem.request.itemHash,
		// }
		const newChatMessage = newChatMessageFactory(db, io);
		socket.on('newChatMessage', wrapHandler(newChatMessage));
		// {
		// 	itemHash: this.hashtagItem.request.itemHash
		// 	message: [encrypted] message,
		// }
	};

	const disconect = (socket) => {

	};

	return {
		connect,
		disconect,
	};
}

module.exports = subscriptionsLight;
