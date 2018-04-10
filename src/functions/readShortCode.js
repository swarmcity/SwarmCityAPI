'use strict';

const logger = require('../logs')(module);

const scheduledTask = require('../scheduler/scheduledTask')();

const dbService = require('../services').dbService;

/**
 * returns name (verb) of this function
 * @return     {null}   none
 */
function name() {
	return 'readShortCode';
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
		name: 'read',
		func: (task) => {
            return dbService.readShortCode(data.shortCode);
		},
		responsehandler: (res, task) => {
			logger.info('responsehandler', res);
			if (task.success) {
				let reply = {
					response: 200,
					data: {
						address: res.address,
                        userName: res.userName,
                        avatar: res.avatar,
					},
				};
				return callback(reply);
			} else {
				let reply = {
					response: 400,
				};
				return callback(reply);
			}
		},
		data: {},
	});
}

module.exports = {
	name: name,
	createTask: createTask,
};
