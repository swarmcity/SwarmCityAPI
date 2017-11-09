/**
 * Scheduled tasks are tasks that need to run any time in the future , or right now.
 */
'use strict';
const uuidv4 = require('uuid/v4');
const workerQueue = require('./workerqueue')();
const logger = require('../logs')();

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
		workerQueue.push(task, task.responsehandler || function() {});
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
		}
	} else {
		// there are no more tasks
	}
}


/**
 * add a task to the scheduledTask scheduler
 *
 * @param      {Object}  task    The task to add
 */
function addTask(task) {
	task.id = uuidv4();
	task.nextRun = task.nextRun || 0;
	if (!task.responsehandler && task.interval) {
		task.responsehandler = (res, task) => {
			task.nextRun = (new Date).getTime() + task.interval;
			addTask(task);
		};
	}
	tasks.push(task);
	logger.info('******* Added scheduled task ID=', task.id);
	_updateSchedule();
}


/**
 * remove a scheduled task - cancels further scheduling of task ( running tasks
 * keep running until complete )
 *
 * @param      {object}  task    - the task to remove
 */
function removeTask(task) {
	let index = tasks.indexOf(task);
	if (index !== -1) {
		tasks.splice(index, 1);
		_updateSchedule();
	} else {
		logger.error('removeTask: cannot find task in task list', task.id);
	}
	if (tasks.length === 0) {
		logger.info('the scheduledTask scheduler is empty');
	}
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

module.exports = function() {
	return ({
		addTask: addTask,
		removeTask: removeTask,
		removeTasks: removeTasks,
		tasks: tasks,
		nextRun: nextRun,
	});
};
