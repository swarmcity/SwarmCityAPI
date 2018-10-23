const shortcodeToIdFactory = (
	db,
	socket
) => async (shortcode) => {
	// shortcode = 34622

	const data = await db.getShortcodeData(shortcode);

	if (!data) {
		throw Error(`No data found for shortcode ${shortcode}`);
	}
	return {
		data,
	};
};

module.exports = shortcodeToIdFactory;
