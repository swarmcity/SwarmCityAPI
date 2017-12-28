'use strict';
require('dotenv').config({
	path: '../.env',
});

const logger = require('../logs')();

const scheduledTask = require('../scheduler/scheduledTask')();

describe('Swarm City scheduler', function() {
	it('should receive all related events right after socket connects', function(done) {
		scheduledTask.addTask({
			nextRun: (new Date).getTime() + 100,
			func: hello,
			interval: 100,
			data: 'a',
		});

		logger.info('there are ', scheduledTask.tasks.length,
			'tasks in the scheduledTask queue');
		logger.info('scheduler will wake up at ', scheduledTask.nextRun);


		scheduledTask.addTask({
			nextRun: (new Date).getTime() + 200,
			func: hello,
			responsehandler: responseHandler,
			data: 'b',
		});

		logger.info('there are ', scheduledTask.tasks.length,
			'tasks in the scheduledTask queue');
		logger.info('scheduler will wake up at ', scheduledTask.nextRun);


		scheduledTask.addTask({
			nextRun: (new Date).getTime() + 300,
			func: hello,
			responsehandler: responseHandler,
			data: 'c',
		});

		done();
	});
	it('should wait a few moments', function(done) {
		setTimeout(() => {
			done();
		}, 1 * 1000);
	});

	it('should cancel all tasks', function(done) {
		scheduledTask.removeTasks(scheduledTask.tasks);
		done();
	});
});

/**
 * Test task
 * @param {object} task - the task to run
 * @return {Promise} - resolves when done
 */
function hello(task) {
	return new Promise((resolve, reject) => {
		logger.info('Hello', task.data);
		task.data = task.data + '+';
		resolve(task.data);
	});
}

/**
 * Test task
 * @param {object} res - the result from the task
 * @param {object} task - the task that ran
 * @return {Promise} - resolves when done
 */
function responseHandler(res, task) {
	return new Promise((resolve, reject) => {
		logger.info('Hello Finished... RES=', res, 'task=', task);
		resolve();
	});
}
