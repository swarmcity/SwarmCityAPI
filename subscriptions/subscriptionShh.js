/**
 * Subscription manager for 'sshsubscription'
 */
'use strict';
const logger = require('../logs.js')();
const web3 = require('../globalWeb3').web3;
const sha3 = require('crypto-js/SHA3');

/**
 * clean up a task from the scheduler when socket wants to unsubscribe
 *
 * @param      {Object}   task    The task
 * @return     {Promise}  result of removing the task (no return value)
 */
function cancelSubscription(task) {
	if (!task || !task.data || !task.data.filterID) {
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

	let chars = '0123456789';
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
				{
					let pincode = getPinCode(5);
					let topic = '0x' + sha3(pincode, {
						outputLength: 32,
					}).toString();
					logger.info('topic', topic);

					web3.shh.generateSymKeyFromPassword(topic)
					.then((symKeyID) => {
						logger.info('key ID', symKeyID);
						web3.shh.newMessageFilter({
							symKeyID: symKeyID,
							ttl: 20,
							topics: [topic],
							minPow: 0.8,
						}).then((filter) => {
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
								cancelSubscription: cancelSubscription,
							});
						});
					})
					.catch((e) => {
						logger.error('generateSymKeyFromPassword', e);
						resolve({
							task: {},
							cancelSubscription: cancelSubscription,
						});
					});
					break;
				}
			default:
				{
					reject(new Error('unknown mode ' + args.mode));
				}
		}
	});
}

module.exports = function() {
	return ({
		name: 'shhsubscribe',
		createSubscription: createSubscription,
	});
};
