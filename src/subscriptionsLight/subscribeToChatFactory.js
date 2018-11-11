const subscribeToChatFactory = (
	db,
	socket
) => async (data) => {
	// data = {
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

	// 4. Emit the full chat to the just joinned socket
	socket.emit(
		'chatChanged',
		chatObject
	);

	// 5. Should reply with a success message:
	const emitter = chatObject.members[data.emitterAddress];
	if (!emitter) {
		throw Error('You are not allowed in this chat: '+data.emitterAddress);
	}
	return {
		key: emitter.key,
	};
};

module.exports = subscribeToChatFactory;
