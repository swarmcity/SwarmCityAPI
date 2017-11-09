/**
 * worker queue is the worker queue for tasks that need to run NOW
 */
'use strict';

const queue = require('async/queue');
const logger = require('../logs')();

// create a queue object with default concurrency 2
let q = queue((task, callback) => {
	task.isRunning = true;
	task.startDate = (new Date).getTime();
	task.func(task).then((res) => {
		task.isRunning = false;
		task.endDate = (new Date).getTime();
		task.success = true;
		logger.info('task success. Duration', task.endDate - task.startDate, 'ms');
		callback(res, task);
	}).catch((err) => {
		logger.error('task error', err);
		task.isRunning = false;
		task.endDate = (new Date).getTime();
		task.success = false;
		callback(null, task);
	});
}, 2);

q.drain = () => {
	logger.info('The WorkerQueue is empty');
};

module.exports = () => {
	return (q);
};
