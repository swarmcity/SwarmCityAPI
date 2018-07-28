/**
 * worker queue is the worker queue for tasks that need to run NOW
 */
'use strict';

const queue = require('async/queue');
// const logger = require('../logs')(module);

// create a queue object with default concurrency 2
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
			callback(null, task);
		});
}, 2);

module.exports = () => {
	return (q);
};
