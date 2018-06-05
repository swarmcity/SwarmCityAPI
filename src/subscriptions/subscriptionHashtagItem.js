/**
 * Subscription manager for 'balance'
 */
'use strict';
const logs = require('../logs.js')(module);
const getHashtagItem = require('../tasks/getHashtagItem')();
const blockHeaderTask = require('../scheduler/blockHeaderTask')();
const validate = require('../validators');


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
		return Promise.reject('Cannot subscribe to a hashtag without a valid address.');
	}
	logs.info('Subscribing to hastagitem for %s', args.address, args.itemHash);

	// create task
	let _task = {
		name: 'hashtagItem',
		func: async (task) => {
			return JSON.stringify(await getHashtagItem
				.getHashtagItem(task.data.address, task.data.itemHash));
		},
		responsehandler: (res, task) => {
			logs.debug('received hashtagItem RES=', JSON.stringify(res, null, 4));
			emitToSubscriber('hashtagItemChanged', JSON.stringify(res));
			return blockHeaderTask.addTask(task);
		},
		data: {
			address: args.address,
			itemHash: args.itemHash,
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
		name: 'hashtagItem',
		createSubscription: createSubscription,
	});
};
