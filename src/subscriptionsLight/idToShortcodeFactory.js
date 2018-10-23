const idToShortcodeFactory = (
	db,
	socket
) => async (data) => {
	// data = {
	// 	<some user info>
	// }

	const digits = 4; // minim number of digits on the shortcode
	const rateLimitBetweenRequests = 500; // ms
	const shortcodeDuration = 120 * 1000; // ms

	// Throttling, limit number of requests
	const clientIp = socket.handshake.address;
	if (await db.getIpRequestingShortcode(clientIp)) {
		throw Error('Wait 500ms to request another shortcode');
	}
	await db.setIpRequestingShortcode(clientIp, true);
	// Non-blocking set
	setTimeout(() => {
		db.setIpRequestingShortcode(clientIp, false);
	}, rateLimitBetweenRequests);

	// Generate a dynamic length shortcode
	// The average number of attempts to get a shortcode is 2
	// In the case a spam attack, the length of the shortcode will grow
	// but don't slow the process of getting shortcode
	const numberOfCodes = await db.getNumberOfShortcodes();
	const maxShortcode = numberOfCodes < 10**digits/2 ? 10**digits : numberOfCodes * 2;
	let shortcode = getShortcode(maxShortcode);
	// The await in the condition makes this while non-blocking
	while (await db.getShortcodeData(shortcode)) {
		shortcode = getShortcode(maxShortcode);
	}

	// Store shortcode
	// shortcodes[shortcode] = data; numberOfShortcodes++
	await db.setShortcodeData(shortcode, data);

	// Program shortcode deletion, non-blocking
	setTimeout(() => {
		// delete shortcodes[shortcode]; numberOfShortcodes--
		db.deleteShortcodeData(shortcode);
	}, shortcodeDuration);

	// 5. Should reply with a success message:
	return {
		shortcode,
	};
};

/**
 * @param {Number} max shortcode number
 * @return {String} shortcode
 */
function getShortcode(max) {
	return String(Math.floor(max*Math.random())).padStart(5, '0');
}

module.exports = idToShortcodeFactory;
