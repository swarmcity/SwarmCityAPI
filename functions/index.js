'use strict';

const logger = require('../logs')();

let handlers = [
	require('./callContract'),
];

/**
 * register the array of socket handlers
 *
 * @param      {Object}  socket  The websocket socket that connected.
 */
function registerHandlers(socket) {
	for (let i = 0, len = handlers.length; i < len; i++) {
		logger.info('registering', handlers[i].name());
		socket.on(handlers[i].name(), (data, callback) => {
			handlers[i].createTask(socket, data, callback);
		});
	}
}

module.exports = () => {
	return {
		registerHandlers: registerHandlers,
	};
};
