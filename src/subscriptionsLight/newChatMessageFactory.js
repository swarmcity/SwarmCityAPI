const newChatMessageFactory = (
	db,
	io
) => async (data) => {
	// data = {
	// 	itemHash: this.hashtagItem.request.itemHash
	// 	message: [encrypted] message,
	// }

	// 1. Should store the message in the database
	// if it doesn't exist, return an error
	let chatObject = await db.addMessageToChat(data.itemHash, data.payload);

	// 2. Should broadcast to everyone in the room, including the sender
	io.in('chat-'+data.itemHash).emit(
		'chatChanged',
		chatObject
	);
};

module.exports = newChatMessageFactory;
