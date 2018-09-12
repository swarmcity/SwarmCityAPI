/**
 * worker queue is the worker queue for tasks that need to run NOW
 */
'use strict';

const queue = require('async/queue');
const logger = require('../logs')(module);

// create a queue object with default concurrency 10
let q = queue((task, callback) => {
	task.isRunning = true;
	task.startDate = (new Date).getTime();
	task.func(task)
		.then((res) => {
			task.isRunning = false;
			task.endDate = (new Date).getTime();
			task.success = true;
			callback(res, task);
		})
		.catch((err) => {
			task.endDate = (new Date).getTime();
			task.isRunning = false;
			task.success = false;
			task.error = err ? err.message : '';
			logger.error(
				'Task "%s" with ID "%s" error. Duration %i ms. Hash %s, %s',
				task.name,
				task.id,
				task.endDate - task.startDate,
				task.data.hash,
				err
			);
			callback(null, task);
		});
}, 8);

module.exports = () => {
	return (q);
};
