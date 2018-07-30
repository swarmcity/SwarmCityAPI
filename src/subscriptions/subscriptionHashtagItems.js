/**
 * Subscription manager for 'balance'
 */
'use strict';
const logs = require('../logs.js')(module);
const jsonHash = require('json-hash');
const getHashtagItems = require('../tasks/getHashtagItems')();
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
	logs.debug('Subscribing to hastagitems for %s', args.address);

	// create task
	let _task = {
		name: 'hashtagItems',
		func: async (task) => {
			return JSON.stringify(await getHashtagItems.getHashtagItems(task.data));
		},
		responsehandler: (res, task) => {
			let replyHash = jsonHash.digest(res);
			if (task.data.lastReplyHash !== replyHash) {
				logs.debug('received hashtagItems RES=', JSON.stringify(res, null, 4));
				emitToSubscriber('hashtagItemsChanged', JSON.stringify(res));
				task.data.lastReplyHash = replyHash;
			} else {
				// logs.info('hashtagItemsChanged => data hasn\'t changed.');
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
		name: 'hashtagItems',
		createSubscription: createSubscription,
	});
};
