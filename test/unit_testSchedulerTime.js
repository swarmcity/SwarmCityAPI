'use strict';
require('dotenv').config({
	path: '../.env',
});

const logger = require('../src/logs')(module);

const should = require('should');

const scheduledTask = require('../src/scheduler/scheduledTask')();

describe('Swarm City scheduler', function() {
	it('should be possible to add tasks to the scheduler', function(done) {
		scheduledTask.addTask({
			nextRun: (new Date).getTime() + 100,
			func: hello,
			interval: 100,
			data: 'a',
		});

        should(scheduledTask.tasks.length).be.equal(1);
		logger.debug('scheduler will wake up at ', scheduledTask.nextRun);

		scheduledTask.addTask({
			nextRun: (new Date).getTime() + 200,
			func: hello,
			responsehandler: responseHandler,
			data: 'b',
		});

        should(scheduledTask.tasks.length).be.equal(2);
		logger.debug('scheduler will wake up at ', scheduledTask.nextRun);

		scheduledTask.addTask({
			nextRun: (new Date).getTime() + 300,
			func: hello,
			responsehandler: responseHandler,
			data: 'c',
		});

        should(scheduledTask.tasks.length).be.equal(3);
		logger.debug('scheduler will wake up at ', scheduledTask.nextRun);

		done();
	});

    it('should be able to provide status', function(done) {
        scheduledTask.status();
        done();
    });

	it('should wait a few moments', function(done) {
		setTimeout(() => {
			done();
		}, 0.5 * 1000);
	});

	it('should cancel all tasks', function(done) {
		scheduledTask.removeAllTasks();
        should(scheduledTask.tasks.length).be.equal(0);
		done();
	});

    it('should be able to provide status when there are no more tasks', function(done) {
        scheduledTask.status();
        done();
    });

	it('should cancel tasks I provide', function(done) {
		scheduledTask.addTask({
			nextRun: (new Date).getTime() + 100,
			func: hello,
			responsehandler: responseHandler,
			data: 'z',
		});
		scheduledTask.addTask({
			nextRun: (new Date).getTime() + 200,
			func: hello,
			responsehandler: responseHandler,
			data: 'y',
		});
        should(scheduledTask.tasks.length).be.equal(2);

		scheduledTask.removeTasks(scheduledTask.tasks);

        setTimeout(() => {
            should(scheduledTask.tasks.length).be.equal(0);
            done();
        }, 1 * 300);
	});

    it('should be possible to immediately remove a task with an interval', function(done) {
        let task = {
			nextRun: (new Date).getTime() + 100,
			func: hello,
			interval: 100,
			data: 'a',
        };

		scheduledTask.addTask(task);

        should(scheduledTask.tasks.length).be.equal(1);
		logger.debug('scheduler will wake up at ', scheduledTask.nextRun);

		scheduledTask.removeTask(task);
        should(scheduledTask.tasks.length).be.equal(0);
        done();
    });

    it('should be possible to wait a while and remove a task with an interval', function(done) {
        let task = {
			nextRun: (new Date).getTime() + 100,
			func: hello,
			interval: 100,
			data: 'a',
        };

		scheduledTask.addTask(task);

        should(scheduledTask.tasks.length).be.equal(1);
		logger.debug('scheduler will wake up at ', scheduledTask.nextRun);

        setTimeout(() => {
            scheduledTask.removeTask(task);
            should(scheduledTask.tasks.length).be.equal(0);
            done();
        }, 2.5 * 100);
    });
});

/**
 * Test task
 * @param {object} task - the task to run
 * @return {Promise} - resolves when done
 */
function hello(task) {
	return new Promise((resolve, reject) => {
		logger.debug('Hello %j', task.data);
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
		logger.debug('Hello Finished... RES=%j task=%j', res, task);
		resolve();
	});
}
