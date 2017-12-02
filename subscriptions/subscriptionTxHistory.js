/**
 * Subscription manager for 'balance'
 */
'use strict';
const logger = require('../logs.js')('subscriptionHashtags');
const jsonHash = require('json-hash');
const db = require('../globalDB').db;
const blockHeaderTask = require('../scheduler/blockHeaderTask')();

const web3 = require('../globalWeb3').web3;

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
			return new Promise((resolve, reject) => {
				resolve([{
					timeDate: 234234234,
					direction: 'in',
					amount: 666 + task.data.count,
					symbol: 'SWT',
					from: '0x0',
					to: '0x0',
					confirmations: 1,
				}, {
					timeDate: 234234234,
					direction: 'out',
					amount: 69,
					symbol: 'SWT',
					from: '0x0',
					to: '0x0',
					confirmations: 60 + task.data.count,
				}]);
			});
		},
		responsehandler: (res, task) => {
			let responseHash = jsonHash.digest(res);
			if (task.data.lastResponse !== responseHash) {
				logger.debug('received modified response RES=', JSON.stringify(res, null, 4));
				emitToSubscriber('txhistoryChanged', res);
				task.data.lastResponse = responseHash;
			} else {
				logger.info('Data hasn\'t changed.');
			}
			task.data.count++;
			return blockHeaderTask.addTask(task);
		},
		data: {
			count: 1,
		},
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
		name: 'txhistory',
		createSubscription: createSubscription,
	});
};
