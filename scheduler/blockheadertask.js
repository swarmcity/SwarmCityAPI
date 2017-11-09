'use strict';

// Scheduled tasks are tasks that need to run when the next ETH block arrives.

const logger = require('../logs')();
const web3 = require('../globalWeb3').web3;
const uuidv4 = require('uuid/v4');

const workerQueue = require('./workerQueue')();

let newBlockHeadersSubscription;
let tasks = [];
let blockNumber = 0;


if (!newBlockHeadersSubscription) {
	newBlockHeadersSubscription = web3.eth.subscribe('newBlockHeaders', (error, result) => {
		if (result && result.number > blockNumber) {
			blockNumber = result.number;
			logger.info('newBlockHeaders event occured. Block height=', blockNumber);
			let task;
			while (task = tasks.shift()) {
				workerQueue.push(task, task.responsehandler);
			}
		}
	});
	logger.info('subscribed to newBlockHeaders via Web3 WS');
}

/**
 * Add a new task to the newBlockHeaders scheduler
 *
 * @param      {Object}  task    The task to add
 */
function addTask(task) {
	task.id = uuidv4();
	tasks.push(task);
	logger.info('******* Added blockheader task ID=', task.id);
	logger.info('newBlockHeaders tasks count=', tasks.length);
}

/**
 * remove a scheduled task
 *
 * @param      {Object}  task    The task to remove
 */
function removeTask(task) {
	let index = tasks.indexOf(task);
	if (index !== -1) {
		tasks.splice(index, 1);
	} else {
		logger.error('removeTask: cannot find task in task list', task.id);
	}
	if (tasks.length === 0) {
		logger.info('the blockheadertask scheduler is empty');
	}
}

/**
 * Remove multiple scheduled tasks
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
	});
};
