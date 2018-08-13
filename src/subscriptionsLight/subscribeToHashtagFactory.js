const subscribeToHashtag = (
	db,
	socket
) => async (data) => {
    // data = {hashtag: '0x3a7ba8c33'}
    const hashtag = data.hashtag;
    if (!hashtag) throw Error('Data must contain a hashtag');

	// 1. Subscribe the emitter to the chat room
	socket.join('hashtag-'+hashtag);

    // 2. Emit the full chat to the just joinned socket
    const hashtagItems = await db.getHashtagItems();
	socket.emit(
		'hashtagItemsChanged',
		hashtagItems
	);

	// 3. Return the hashtagMetadata
	return await db.getHashtag(hashtag);
};

module.exports = subscribeToHashtag;
