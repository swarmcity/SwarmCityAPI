/**
 * Subscription manager for 'balance'
 */
'use strict';
const logger = require('../logs.js')('subscriptionHashtags');
const jsonHash = require('json-hash');
const db = require('../globaldb').db;
const blockHeaderTask = require('../scheduler/blockHeaderTask')();

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
						// this is debug stuff
						hashtags.push({
							name: 'Random ' + Math.floor(Math.random() * 10 + 5),
							deals: Math.floor(Math.random() * 10 + 5),
							id: '1c9v87bc98v7a',
							commission: 0.05,
							maintainer: '0x369D787F3EcF4a0e57cDfCFB2Db92134e1982e09',
							contact: [{
								name: 'hashtagman2@gmail.com',
								link: 'mailto:hashtagman2@gmail.com',
							}, {
								name: '@hashtag2 (Twitter)',
								link: 'http://twitter.com/@hashtag2',
							}],
						});
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
			let responseHash = jsonHash.digest(res);
			if (task.data.lastResponse !== responseHash) {
				logger.debug('received modified response RES=', JSON.stringify(res, null, 4));
				task.data.socket.emit('hashtagsChanged', res);
				task.data.lastResponse = responseHash;
			} else {
				logger.info('Data hasn\'t changed.');
			}
			return blockHeaderTask.addTask(task);
		},
		data: {
			socket: socket,
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
		name: 'hashtags',
		createSubscription: createSubscription,
	});
};
