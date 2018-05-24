/**
 * Scheduled tasks are tasks that need to run any time in the future , or right now.
 */
'use strict';
const uuidv4 = require('uuid/v4');
const IPFSQueue = require('./IPFSQueue')();
const logger = require('../logs')(module);

let tasks = [];
let nextTaskTimer;
let nextRun;

/**
 * update schedule
 * - sorts tasks on due date
 * - shifts & pushes tasks that have to run into the worker queue
 * - calculates & sets the interval when the updateschedule needs to run again ( if any )
 * - sleep
 */
function _updateSchedule() {
	tasks.sort((a, b) => {
		return a.nextRun - b.nextRun;
	});

	let now = (new Date).getTime();
	while (tasks[0] && tasks[0].nextRun <= now) {
		let task = tasks.shift();
		IPFSQueue.push(task, task.responsehandler || function() {});
	}

	clearTimeout(nextTaskTimer);
	nextRun = null;

	let due = 0;
	if (tasks[0]) {
		due = tasks[0].nextRun - now;
		if (due > 0) {
			nextTaskTimer = setTimeout(() => {
				_updateSchedule();
			}, due);
			nextRun = tasks[0].nextRun;
			logger.info('scheduler to sleep for %i ms', due);
			logger.info('next task is \'%s\'', tasks[0].name);
		} else {
			_updateSchedule();
		}
	} else {
		// there are no more tasks
	}
}


/**
 * add a task to the scheduledTask scheduler
 *
 * @param      {Object}  task    The task to add
 * @return     {Promise}  promise that resolves after addTask is ready
 */
function addTask(task) {
	task.id = task.id || uuidv4();
	task.nextRun = task.nextRun || 0;
	task.name = task.name || task.func.name || '(anonymous function)';
	if (!task.responsehandler && task.interval && task.interval > 0) {
		task.responsehandler = (res, task) => {
			logger.info('Schedule IPFS task again in %i ms', task.interval);
			task.nextRun = (new Date).getTime() + task.interval;
			return addTask(task);
		};
	}
	tasks.push(task);
	logger.info(
        'Added IPFS task "%s" with ID="%s" next run=',
        task.name,
        task.id,
        task.nextRun ? task.nextRun : 'now'
    );
	_updateSchedule();
	return Promise.resolve();
}


/**
 * remove a scheduled task - cancels further scheduling of task ( running tasks
 * keep running until complete )
 *
 * @param      {object}  task    - the task to remove
 * @return     {Promise}  promise that resolves after removeTask is ready
 */
function removeTask(task) {
	let index = tasks.indexOf(task);
	if (index !== -1) {
		tasks.splice(index, 1);
		_updateSchedule();
	} else {
		logger.error('removeTask: cannot find task "%s" in task list', task.id);
	}
	if (tasks.length === 0) {
		logger.info('the scheduledTask scheduler is empty');
	}
	return Promise.resolve();
}

/**
 * remove a list of tasks from the scheduler
 *
 * @param      {Array}  taskArray  The task array
 */
function removeTasks(taskArray) {
	for (let i = 0; i < taskArray.length; i++) {
		removeTask(taskArray[i]);
	}
}

/**
 * Removes all tasks.
 */
function removeAllTasks() {
	logger.info('removing all task from IPFSTask scheduler (%s)', tasks.length);
	for (let i = 0; i < tasks.length; i++) {
		removeTask(tasks[i]);
	}
}

/**
 * dump status of this module to the log
 *
 * @return     {Promise}  Resolves when status dumped.
 */
function status() {
	let statusId = uuidv4();
	logger.info('---IPFSTask status [\'%s\']---', statusId);
	if (tasks.length === 0) {
		logger.info('No tasks');
	} else {
		for (let i = 0; i < tasks.length; i++) {
			let task = tasks[i];
			logger.info(
                '%i: %s [socket %s]',
                i + 1,
                task.name || task.func.name,
                task.socket ? task.socket.id : 'none'
            );
		}
		logger.info('next run:', nextRun);
	}
	logger.info('---/IPFSTask status [\'%s\']---', statusId);
	return Promise.resolve();
}

module.exports = function() {
	return ({
		addTask: addTask,
		removeTask: removeTask,
		removeTasks: removeTasks,
		removeAllTasks: removeAllTasks,
		tasks: tasks,
		nextRun: nextRun,
		status: status,
	});
};
