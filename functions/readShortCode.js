'use strict';
const scheduledTask = require('../scheduler/scheduledTask')();
const db = require('../globalDB').db;
const logger = require('../logs')('readShortCode');

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
			logger.info('readShortCode start', data);
			return new Promise((resolve, reject) => {
				let key = 'shortcode-' + data.shortcode;
				db.get(key).then((val) => {
					// so we have data..
					try {
						let data = JSON.parse(val);
						logger.info('We found data in DB', data);
						// is the code still valid ? If it has not expired, return the data.
						if (data.validUntil && data.validUntil >= (new Date).getTime()) {
							logger.info('data is OK ', data);
							return resolve(data.payload);
						}
						logger.info('data has expired');
						return reject();
					} catch (e) {
						// can't read the data.
						return reject();
					}
				}).catch((err) => {
					if (err.notFound) {
						logger.error('key', key, 'not found (yet) in DB. ');
						return reject();
					}
					reject(new Error(err));
				});
			});
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
