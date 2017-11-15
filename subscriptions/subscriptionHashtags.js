/**
 * Subscription manager for 'balance'
 */
'use strict';
const logs = require('../logs.js')();
const jsonHash = require('json-hash');
const web3 = require('../globalWeb3').web3;

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
	logs.info('subscribe to hashtags please....');
	// create task
	let _task = {
		func: (task) => {
			return new Promise((resolve, reject) => {
				// TODO : check if 'args' is a valid set of parameters to the 
				// subscribe function
				web3.eth.subscribe('logs', args, (err, res) => {
						if (err) {
							reject(new Error(err));
						} else {
							resolve();
						}
					}).on("data", function(log) {
						logs.info('-----------> ', log);
					})
					.on("changed", function(log) {});;
			});
		},
		responsehandler: (res, task) => {
			return Promise.resolve();
			// let replyHash = jsonHash.digest(res);
			// if (task.data.lastReplyHash !== replyHash) {
			// 	logs.debug('received getBalance RES=', JSON.stringify(res, null, 4));
			// 	task.data.socket.emit('balanceChanged', res);
			// 	task.data.lastReplyHash = replyHash;
			// } else {
			// 	logs.info('getBalance => data hasn\'t changed.');
			// }
			// task.data.socket.emit('balanceChanged', res);
			// return blockHeaderTask.addTask(task);
		},
		data: {
			socket: socket,
			address: args.address,
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
