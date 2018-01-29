'use strict';

const logger = require('../logs')(module);

let handlers = [
	require('./callContract'),
	require('./sendShhMessage'),
	require('./sendRawTx'),
	require('./readShortCode'),
	require('./ipfsCat'),
];

/**
 * register the array of socket handlers
 *
 * @param      {Object}  socket  The websocket socket that connected.
 */
function registerHandlers(socket) {
	for (let i = 0, len = handlers.length; i < len; i++) {
		logger.info('Registering socket handler %s', handlers[i].name());
		socket.on(handlers[i].name(), (data, callback) => {
            if(handlers[i].execute) {
			    handlers[i].execute(socket, data, callback);
            } else {
			    handlers[i].createTask(socket, data, callback);
            }
		});
	}
}

module.exports = () => {
	return {
		registerHandlers: registerHandlers,
	};
};
