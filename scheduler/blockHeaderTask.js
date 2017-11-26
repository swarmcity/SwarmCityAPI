'use strict';

// Scheduled tasks are tasks that need to run when the next ETH block arrives.

const logger = require('../logs')('blockheadertask');
const web3 = require('../globalWeb3').web3;
const uuidv4 = require('uuid/v4');

const workerQueue = require('./workerQueue')();

let newBlockHeadersSubscription;
let tasks = [];
let blockNumber = 0;

/**
 * checks if the tasks queue is empty or not - and switch the WEB3 listener
 * accordinly on or off
 */
function checkListenerState() {
	if (tasks.length === 0) {
		logger.info('the blockheadertask scheduler is empty');
		stopListening();
	} else {
		startListening();
	}
}
/**
 * Stop listening to web3 events
 */
function stopListening() {
	if (newBlockHeadersSubscription) {
		logger.info('stop listening to newblock events');
		newBlockHeadersSubscription.unsubscribe(function(error, success) {
			if (success) {
				logger.info('Successfully unsubscribed!');
				newBlockHeadersSubscription = null;
			}
		});
	}
}

/**
 * Starts listening to web3 newBlockHeaders events.
 */
function startListening() {
	if (!newBlockHeadersSubscription) {
		newBlockHeadersSubscription = web3.eth.subscribe('newBlockHeaders', (error, result) => {
			if (result && result.number > blockNumber) {
				blockNumber = result.number;
				logger.info('newBlockHeaders event occured. Block height=', blockNumber);
				let task;
				while (task = tasks.shift()) {
					workerQueue.push(task, task.responsehandler);
				}
				checkListenerState();
			}
		});
		logger.info('start listening to newBlockHeaders via Web3 WS');
	}
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
	startListening();
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


/**
 * Removes all tasks.
 */
function removeAllTasks() {
	logger.info('removing all task from blockHeaderTask scheduler (', tasks.length, ')');
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
	logger.info('---Blockheadertask status [', statusId, ']---');
	if (tasks.length === 0) {
		logger.info('No tasks');
	} else {
		logger.info('tasks:');

		for (let i = 0; i < tasks.length; i++) {
			let task = tasks[i];
			logger.info(i + 1, ':', task.func.name, task.socket.id);
		}
	}
	logger.info('---/Blockheadertask status [', statusId, ']---');
	return Promise.resolve();
}

module.exports = function() {
	return ({
		addTask: addTask,
		removeTask: removeTask,
		removeTasks: removeTasks,
		removeAllTasks: removeAllTasks,
		tasks: tasks,
		status: status,
	});
};
