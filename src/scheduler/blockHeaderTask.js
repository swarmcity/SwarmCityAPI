'use strict';

// Scheduled tasks are tasks that need to run when the next ETH block arrives.

const logger = require('../logs')(module);
const web3 = require('../globalWeb3').web3;
const uuidv4 = require('uuid/v4');

const workerQueue = require('./workerQueue')();

let newBlockHeadersSubscription;
let tasks = [];
let blockNumber = 0;

/**
 * Gets the blockNumber for a blockHeaderTask
 *
 * @param   {Object}    task    A task that's being run as blockHeaderTask
 * @return  {Number}   blockNumber
 */
function getBlockNumber(task) {
    if (task && task.data && task.data.blockNumber) {
        return task.data.blockNumber;
    } else {
        return blockNumber;
    }
}

/**
 * checks if the tasks queue is empty or not - and switch the WEB3 listener
 * accordinly on or off
 */
function checkListenerState() {
	if (tasks.length === 0) {
		logger.debug('the blockheadertask scheduler is empty');
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
		logger.debug('stop listening to newblock events');
		newBlockHeadersSubscription.unsubscribe(function(error, success) {
			if (success) {
				logger.debug('Successfully unsubscribed!');
				newBlockHeadersSubscription = null;
				if (tasks.length != 0) {
					startListening();
				}
			}
		});
	}
}

/**
 * Starts listening to web3 newBlockHeaders events.
 *
 * If we are already listening, we just keep on doing that.
 */
function startListening() {
	if (!newBlockHeadersSubscription) {
		newBlockHeadersSubscription = web3.eth.subscribe('newBlockHeaders', (error, result) => {
			if (result && result.number > blockNumber) {
				blockNumber = result.number;
				logger.debug('newBlockHeaders event occured. Block number=%i', blockNumber);
				let task;
				while (task = tasks.shift()) {
                    logger.debug('Adding new task %s to queue', task.id);
                    task.data.blockNumber = blockNumber;
					workerQueue.push(task, task.responsehandler);
				}
				checkListenerState();
			}
		});
		logger.debug('start listening to newBlockHeaders via Web3 WS');
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
	logger.debug('******* Added blockheader task ID=%s', task.id);
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
		logger.error('removeTask: cannot find task %s in task list', task.id);
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
	logger.debug('removing all task from blockHeaderTask scheduler (%i)', tasks.length);
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
	if (tasks.length === 0) {
		// logger.info('No tasks');
	} else {
		// logger.info('tasks:');

		for (let i = 0; i < tasks.length; i++) {
			let task = tasks[i];
			logger.debug(i + 1, ':', task.func.name, task.socket.id);
		}
	}
	// logger.info('---/Blockheadertask status [%s]---', statusId);
	return Promise.resolve();
}

module.exports = function() {
	return ({
        getBlockNumber: getBlockNumber,
		addTask: addTask,
		removeTask: removeTask,
		removeTasks: removeTasks,
		removeAllTasks: removeAllTasks,
		tasks: tasks,
		status: status,
	});
};
