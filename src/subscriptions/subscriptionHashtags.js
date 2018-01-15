/**
 * Subscription manager for 'balance'
 */
'use strict';
const logger = require('../logs.js')('subscriptionHashtags');
const jsonHash = require('json-hash');
const blockHeaderTask = require('../scheduler/blockHeaderTask')();

const dbService = require('../services').dbService;

/**
 * clean up a task from the scheduler when socket wants to unsubscribe
 *
 * @param      {Object}   task    The task
 * @return     {Promise}  result of removing the task (no return value)
 */
function cancelSubscription(task) {
	return Promise.resolve();
}

/**
 * Creates a subscription.
 *
 * @param      {Function} 	emitToSubscriber the function to call when you want to emit data
 * @param      {Object}  	args    The parameters sent with the subscription
 * @return     {Promise}  	resolves with the subscription object
 */
function createSubscription(emitToSubscriber, args) {
	// create task
	let _task = {
		func: (task) => {
            return dbService.getHashtagList();
		},
		responsehandler: (res, task) => {
			let responseHash = jsonHash.digest(res);
			if (task.data.lastResponse !== responseHash) {
				logger.debug('received modified response RES=', JSON.stringify(res, null, 4));
				emitToSubscriber('hashtagsChanged', res);
				task.data.lastResponse = responseHash;
			} else {
				logger.info('Data hasn\'t changed.');
			}
			return blockHeaderTask.addTask(task);
		},
		data: {},
	};
	blockHeaderTask.addTask(_task);
	// run it a first time return subscription
	return _task.func(_task).then((reply) => {
		return Promise.resolve({
			task: _task,
			initialResponse: reply,
			cancelSubscription: cancelSubscription,
		});
	});
}

module.exports = function() {
	return ({
		name: 'hashtags',
		createSubscription: createSubscription,
	});
};
