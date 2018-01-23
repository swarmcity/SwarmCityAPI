/**
 * Subscription manager for 'balance'
 */
'use strict';

const logs = require('../logs.js')(module);

const validate = require('../validators');
const jsonHash = require('json-hash');

const getBalance = require('../tasks/getBalance')();
const blockHeaderTask = require('../scheduler/blockHeaderTask')();

/**
 * clean up a task from the scheduler when socket wants to unsubscribe
 *
 * @param      {Object}   task    The task
 * @return     {Promise}  result of removing the task (no return value)
 */
function cancelSubscription(task) {
	return Promise.resolve(
		blockHeaderTask.removeTask(task)
	);
}

/**
 * Creates a subscription.
 *
 * @param      {Function} 	emitToSubscriber the function to call when you want to emit data
 * @param      {Object}  	args    The parameters sent with the subscription
 * @return     {Promise}  	resolves with the subscription object
 */
function createSubscription(emitToSubscriber, args) {
	// check arguments
	if (!args || !args.address || !validate.isAddress(args.address)) {
		return Promise.reject('Cannot subscribe to a balance without a valid address.');
	}
	logs.info('Subscribing to balance for %s', args.address);

	// create task
	let _task = {
		func: (task) => {
			return Promise.resolve(getBalance.getBalance(task.data).then((res) => {
                if (!task.data.lastReplyHash) {
			        let replyHash = jsonHash.digest(res);
				    task.data.lastReplyHash = replyHash;
			        logs.debug('no lastReplyhash, setting it to %s', replyHash);
                }
				return (res);
			}));
		},
		responsehandler: (res, task) => {
			logs.debug('received getBalance RES=%j', res);
			let replyHash = jsonHash.digest(res);
			if (task.data.lastReplyHash !== replyHash) {
				logs.info('getBalance => data has changed. New value: %j', res);
				emitToSubscriber('balanceChanged', res);
				task.data.lastReplyHash = replyHash;
			} else {
				logs.info('getBalance => data hasn\'t changed.');
			}
			return blockHeaderTask.addTask(task);
		},
		data: {
			address: args.address,
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
		name: 'balance',
		createSubscription: createSubscription,
	});
};
