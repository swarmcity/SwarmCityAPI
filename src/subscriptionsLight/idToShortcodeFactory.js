const idToShortcodeFactory = (
	db,
	socket
) => {
	let lastCheck = 0;
	return async (data) => {
		// data = {
		// 	<some user info>
		// }

		const digits = 4; // minim number of digits on the shortcode
		const rateLimitBetweenRequests = 500; // ms
		const shortcodeDuration = 120 * 1000; // ms

		// Throttling, limit number of requests
		if (Date.now() - lastCheck < rateLimitBetweenRequests) {
			throw Error('Wait 500ms to request another shortcode');
		}
		lastCheck = Date.now();

		// Generate a dynamic length shortcode
		// The average number of attempts to get a shortcode is 2
		// In the case a spam attack, the length of the shortcode will grow
		// but don't slow the process of getting shortcode
		const numberOfCodes = await db.getNumberOfShortcodes();
		const maxShortcode = numberOfCodes < 10**digits/2 ? 10**digits : numberOfCodes * 2;
		let shortcode = getShortcode(maxShortcode, digits);
		// The await in the condition makes this while non-blocking
		while (await db.getShortcodeData(shortcode)) {
			shortcode = getShortcode(maxShortcode, digits);
		}

		// Store shortcode
		// shortcodes[shortcode] = data; numberOfShortcodes++
		await db.setShortcodeData(shortcode, data);

		// Program shortcode deletion, non-blocking
		setTimeout(() => {
			// delete shortcodes[shortcode]; numberOfShortcodes--
			db.deleteShortcodeData(shortcode);
		}, shortcodeDuration);

		return shortcode;
	};
};

/**
 * @param {Number} max shortcode number
 * @param {Number} digits shortcode number
 * @return {String} shortcode
 */
function getShortcode(max, digits) {
	return String(Math.floor(max*Math.random())).padStart(digits, '0');
}

module.exports = idToShortcodeFactory;
