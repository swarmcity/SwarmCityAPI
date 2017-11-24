/**
 * worker queue is the worker queue for tasks that need to run NOW
 */
'use strict';

const queue = require('async/queue');
const logger = require('../logs')('workerQueue');

// create a queue object with default concurrency 2
let q = queue((task, callback) => {
	logger.info('Starting task "' + task.name + '" ID=', task.id);
	task.isRunning = true;
	task.startDate = (new Date).getTime();
	task.func(task)
		.then((res) => {
			task.isRunning = false;
			task.endDate = (new Date).getTime();
			task.success = true;
			logger.info('task "' + task.name +
				'" success. Duration', task.endDate - task.startDate, 'ms');
			callback(res, task);
		})
		.catch((err) => {
			task.endDate = (new Date).getTime();
			task.isRunning = false;
			task.success = false;
			logger.error('task "' + task.name + '" ID=' +task.id + '" error. Duration',
				task.endDate - task.startDate, 'ms - Error=', err);
			callback(null, task);
		});
}, 2);

q.drain = () => {
	logger.info('The WorkerQueue is empty');
};

module.exports = () => {
	return (q);
};
