'use strict';
const scheduledTask = require('../scheduler/scheduledTask')();
const logger = require('../logs')(module);
const web3 = require('../globalWeb3').web3;
const shhHelpers = require('../globalWeb3').shhHelpers;

/**
 * returns name (verb) of this function
 * @return     {null}   none
 */
function name() {
	return 'sendShhMessage';
}

/**
 * create and execute the task
 *
 * @param      {Object}    socket    The socket
 * @param      {Object}    data      The data
 * @param      {Function}  callback  The callback
 */
function createTask(socket, data, callback) {
	scheduledTask.addTask({
		name: 'sendShhMessage',
		func: (task) => {
			logger.info('sendShhMessage start', data);
			return new Promise((resolve, reject) => {
				web3.shh.generateSymKeyFromPassword(data.shortcode).then((symKeyID) => {
					const opts = {
						symKeyID: symKeyID,
						ttl: 10,
						topic: shhHelpers.shhHash(data.shortcode),
						payload: web3.utils.asciiToHex(JSON.stringify(data.payload)),
						powTime: 10,
						powTarget: 0.3,
					};
					logger.info('shh opts', opts, data);
					web3.shh.post(opts);
				});
			});
		},
		responsehandler: (res, task) => {
			if (task.success) {
				let reply = {
					response: 200,
					data: res,
				};
				return callback(reply);
			} else {
				let reply = {
					response: 500,
					data: res,
				};
				return callback(reply);
			}
		},
		data: {
			socket: socket,
		},
	});
}

module.exports = {
	name: name,
	createTask: createTask,
};
