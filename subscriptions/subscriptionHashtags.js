/**
 * Subscription manager for 'balance'
 */
'use strict';
const logger = require('../logs.js')('subscriptionHashtags');
const jsonHash = require('json-hash');
const web3 = require('../globalWeb3').web3;
const db = require('../globaldb').db;

//const getBalance = require('../tasks/getBalance')();
//const blockHeaderTask = require('../scheduler/blockHeaderTask')();

/**
 * clean up a task from the scheduler when socket wants to unsubscribe
 *
 * @param      {Object}   task    The task
 * @return     {Promise}  result of removing the task (no return value)
 */
function cancelSubscription(task) {
	return Promise.resolve(
		//blockHeaderTask.removeTask(task)
	);
}

/**
 * Creates a subscription.
 *
 * @param      {Object}  socket  The socket to send data to
 * @param      {Object}  args    The parameters sent with the subscription
 * @return     {Promise}  resolves with the subscription object
 */
function createSubscription(socket, args) {
	logger.info('subscribe to hashtags please....');
	// create task
	let _task = {
		func: (task) => {
			return new Promise((resolve, reject) => {
				db.get(process.env.PARAMETERSCONTRACT + '-hashtaglist').then((val) => {
					try {
						let hashtags = JSON.parse(val);
						logger.info('Hashtags: ', hashtags);
						resolve(hashtags);

					} catch (e) {
						reject(new Error(e));
					}
				}).catch((err) => {
					logger.error(new Error(err));
					reject(new Error(err));
				});
			});
		},
		responsehandler: (res, task) => {
			task.data.socket.emit('hashtagsChanged', res);
			return Promise.resolve();
		},
		data: {
			socket: socket,
		},
	};
	//blockHeaderTask.addTask(_task);
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
