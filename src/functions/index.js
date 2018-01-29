'use strict';

const logger = require('../logs')(module);

let handlers = [
	require('./callContract'),
	require('./sendShhMessage'),
	require('./sendRawTx'),
	require('./readShortCode'),
];

const scheduledTask = require('../scheduler/scheduledTask')();

const ipfsService = require('../services').ipfsService;
const IpfsCatFunction = require('./ipfsCat').IpfsCatFunction;

handlers.push(new IpfsCatFunction(scheduledTask, ipfsService));

/**
 * register the array of socket handlers
 *
 * @param      {Object}  socket  The websocket socket that connected.
 */
function registerHandlers(socket) {
	for (let i = 0, len = handlers.length; i < len; i++) {
		logger.info('Registering socket handler %s', handlers[i].name());
		socket.on(handlers[i].name(), (data, callback) => {
            if(typeof handlers[i].execute === 'function') {
			    handlers[i].execute(socket, data, callback);
            } else {
			    handlers[i].createTask(socket, data, callback);
            }
		});
	}
}

module.exports = {
	registerHandlers: registerHandlers,
};
