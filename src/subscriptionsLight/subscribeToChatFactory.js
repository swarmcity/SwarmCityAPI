const subscribeToChatFactory = (
	db,
	socket
) => async (data) => {
	// data = {
	// 	accessKeys: [ '+TiSxGNciyjpba01hlMkunZCgdGUUlVL.mQ2wmJAOP
	//    DBwQ59W+kxYt3dKLmaZ2KQv5sKwAmriP/AtNi1rM2O7JRvgzEterG24
	//    cSbGhWNtL0i+KJBNvR78wFYN2CFtSWygmBmeZutZ+3w=:DiO5Rsk57c
	//    AUVvwLSHfr22YMrdWojyL3s7Yf0PGeTw4=' ],
	// 	itemHash: this.hashtagItem.request.itemHash,
	// }

	// 1. Should create the chat object in the database
	// if it doesn't exist, or create it if it exist
	let chatObject = await db.getChat(data.itemHash);

	// 2. Should check if there is an accessKeys key,
	// and add those to the chat object
	if (data.accessKeys) {
		chatObject = await db.addAccessKeysToChat(data.itemHash, data.accessKeys);
	}

	// 3. Should subscribe the emitter to the chat room
	socket.join('chat-'+data.itemHash);

	// 4. Emit the full chat to the just joinned socket
	socket.emit(
		'chatChanged',
		chatObject
	);
};

module.exports = subscribeToChatFactory;
