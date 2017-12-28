'use strict';
const scheduledTask = require('../scheduler/scheduledTask')();
const logs = require('../logs')('ipfsCat');
const ipfs = require('../globalIPFS')();

/**
 * returns name (verb) of this function
 * @return     {null}   none
 */
function name() {
	return 'ipfscat';
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
		func: (task) => {
			logs.info('ipfscat start');
			return ipfs.cat(data.hash);
		},
		responsehandler: (res, task) => {
			if (task.success && res) {
				// format the output if requested
				// else return the Buffer
				switch (data.format || 'buffer') {
					case 'base64':
					case 'ascii':
					case 'hex':
					case 'utf8':
						res = res.toString(data.format);
						break;
				}
				let reply = {
					response: 200,
					data: res,
				};
				return callback(reply);
			} else {
				let reply = {
					response: 500,
					data: res,
					error: task.error,
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
