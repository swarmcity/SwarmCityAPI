/**
 * worker queue is the worker queue for tasks that need to run NOW
 */
'use strict';

const queue = require('async/queue');
const logger = require('../logs')(module);

// create a queue object with default concurrency 2
let q = queue((task, callback) => {
	logger.info('Starting task "%s" with ID "%s"', task.name, task.id);
	task.isRunning = true;
	task.startDate = (new Date).getTime();
	task.func(task)
		.then((res) => {
			task.isRunning = false;
			task.endDate = (new Date).getTime();
			task.success = true;
			logger.info(
                'Task "%s" with ID "%s" success. Duration %i ms.',
                task.name,
                task.id,
                task.endDate - task.startDate
            );
			callback(res, task);
		})
		.catch((err) => {
			task.endDate = (new Date).getTime();
			task.isRunning = false;
			task.success = false;
			task.error = err ? err.message : '';
			logger.error(
                'Task "%s" with ID "%s" error. Duration %i ms. Error: %j',
                task.name,
                task.id,
                task.endDate - task.startDate,
                err
            );
			callback(null, task);
		});
}, 2);

q.drain = () => {
	logger.info('The WorkerQueue is empty');
};

module.exports = () => {
	return (q);
};
