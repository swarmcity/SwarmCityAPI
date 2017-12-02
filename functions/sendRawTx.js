'use strict';
const scheduledTask = require('../scheduler/scheduledTask')();
const logs = require('../logs')('sendRawTx');
const web3 = require('../globalWeb3').web3;

/**
 * returns name (verb) of this function
 * @return     {null}   none
 */
function name() {
	return 'sendRawTx';
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
			logs.info('sendRawTx start');
			return new Promise((resolve, reject) => {
				web3.eth.sendSignedTransaction(data.tx)
					.on('receipt', resolve)
					.on('error', reject);
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
