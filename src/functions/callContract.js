'use strict';
const scheduledTask = require('../scheduler/scheduledTask')();
const logs = require('../logs')(module);
const web3 = require('../globalWeb3').web3;
const validate = require('../validators');

/**
 * returns name (verb) of this function
 * @return     {null}   none
 */
function name() {
	return 'callContract';
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
			logs.info('callContract start');
			return new Promise((resolve, reject) => {
				try {
					if (validate.isAddress(data.address) &&
						data.method) {
						const myContract =
							new web3.eth.Contract(data.abi, data.address);
						if (data.arguments) {
							myContract.methods[data.method].apply(null, data.arguments).call()
								.then((value) => {
									resolve(value);
								}).catch((err) => {
									reject(err);
								});
						} else {
							myContract.methods[data.method]().call()
								.then((value) => {
									resolve(value);
								}).catch((err) => {
									reject(err);
								});
						}
					} else {
						reject(new Error('input params not valid', data));
					}
				} catch (error) {
					logs.error('callContract error', error);
					reject(error);
				}
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
