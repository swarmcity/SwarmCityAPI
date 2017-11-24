/**
 * Subscription manager for 'sshsubscription'
 */
'use strict';
const logger = require('../logs.js')();
//const jsonHash = require('json-hash');
const web3 = require('../globalWeb3').web3;
const SHA3 = require("crypto-js/SHA3");

/**
 * clean up a task from the scheduler when socket wants to unsubscribe
 *
 * @param      {Object}   task    The task
 * @return     {Promise}  result of removing the task (no return value)
 */
function cancelSubscription(task) {
	if (!task || !task.data || !task.data.filterID){
		logger.info('no SHH filter to remove');
		return Promise.resolve();
	}
	logger.info('cancel sub', task.data.filterID);
	return web3.shh.deleteMessageFilter(task.data.filterID);
}

/**
 * create random pincode
 *
 * @param      {number}  decimals  The decimals
 * @return     {string}  a shortcode
 */
function getPinCode(decimals) {

	if (decimals < 2) {
		decimals = 2;
	}

	let chars = "0123456789";
	let randomstring = '';

	for (let i = 0; i < decimals; i++) {
		let rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum, rnum + 1);
	}
	return randomstring;
}


/**
 * Creates a subscription.
 *
 * @param      {Object}  socket  The socket to send data to
 * @param      {Object}  args    The parameters sent with the subscription
 * @return     {Promise}  resolves with the subscription object
 */
function createSubscription(socket, args) {

	return new Promise((resolve, reject) => {

		switch (args.mode) {
			case 'shortcode':
				let pincode = getPinCode(5);
				let topic = '0x' + SHA3(pincode, {
					outputLength: 32
				}).toString();
				logger.info('topic', topic);

				web3.shh.generateSymKeyFromPassword(topic)
					.then((symKeyID) => {
						logger.info('key ID', symKeyID);
						let filter = web3.shh.newMessageFilter({
							symKeyID: symKeyID,
							ttl: 20,
							topics: [topic],
							minPow: 0.8,
						}).then((filter) => {
							//							args.filterID = filter;
							resolve({
								task: {
									data: {
										pincode: pincode,
										filterID: filter,
									},
								},
								initialResponse: {
									pincode: pincode,
									symKeyID: symKeyID,
									topic: topic,
								},
								cancelSubscription: cancelSubscription,
							});
						}).catch((e) => {
							logger.error('newMessageFilter', e);
							resolve({
								task: {},
								cancelSubscription: cancelSubscription
							});
						});
					})
					.catch((e) => {
						logger.error('generateSymKeyFromPassword', e);
						resolve({
							task: {},
							cancelSubscription: cancelSubscription
						});
					});

				break;
			default:
				return reject(new Error('unknown mode ' + args.mode));
				break;

		}


	});

	// 		
	// logger.info('subscribe to balance please....');
	// // create task
	// let _task = {
	// 	func: (task) => {
	// 		return Promise.resolve(getBalance.getBalance(task.data).then((res) => {
	// 			task.data.lastReplyHash = jsonHash.digest(res);
	// 			return (res);
	// 		}));
	// 	},
	// 	responsehandler: (res, task) => {
	// 		let replyHash = jsonHash.digest(res);
	// 		if (task.data.lastReplyHash !== replyHash) {
	// 			logger.debug('received RES=', JSON.stringify(res, null, 4));
	// 			task.data.socket.emit('shhSubscriptionMessage', res);
	// 			task.data.lastReplyHash = replyHash;
	// 		} else {
	// 			logger.info('getBalance => data hasn\'t changed.');
	// 		}
	// 		return blockHeaderTask.addTask(task);
	// 	},
	// 	data: {
	// 		socket: socket,
	// 		address: args.address,
	// 		mode: args.mode,
	// 	},
	// };
	// blockHeaderTask.addTask(_task);
	// // run it a first time return subscription
	// return _task.func(_task).then((reply) => {
	// 	return Promise.resolve({
	// 		task: _task,
	// 		initialResponse: reply,
	// 		cancelSubscription: cancelSubscription,
	// 	});
	// });
}

module.exports = function() {
	return ({
		name: 'shhsubscribe',
		createSubscription: createSubscription,
	});
};
