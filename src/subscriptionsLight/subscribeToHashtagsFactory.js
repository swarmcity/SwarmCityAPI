const subscribeToHashtags = (
	db,
	socket
) => async (data) => {
    // data = {}

	// 1. Subscribe the emitter to the chat room
	socket.join('hashtags');

    // 2. Emit the full chat to the just joinned socket
    const hashtags = await db.getHashtags();
	socket.emit(
		'hashtagsChanged',
		{
			response: 200,
			data: hashtags,
		}
	);
};

module.exports = subscribeToHashtags;
