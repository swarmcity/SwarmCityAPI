'use strict';

const logger = require('../logs')('readShortCode');

const scheduledTask = require('../scheduler/scheduledTask')();

const dbc = require('../connections/db').db;
const DBService = require('../services/db').DBService;
const dbService = new DBService(dbc);

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
		name: 'readShortCode',
		func: (task) => {
            return dbService.readShortCode(data.shortcode);
		},
		responsehandler: (res, task) => {
			logger.info('responsehandler', res);
			if (task.success) {
				let reply = {
					response: 200,
					data: {
						payload: res,
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
