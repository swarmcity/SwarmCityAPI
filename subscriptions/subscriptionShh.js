/**
 * Subscription manager for 'sshsubscription'
 */
'use strict';
const logger = require('../logs.js')('subscriptionshh');
const web3 = require('../globalWeb3').web3;
const shhHelpers = require('../globalWeb3').shhHelpers;


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
 * create random shortcode
 *
 * @param      {number}  decimals  The decimals
 * @return     {string}  a shortcode
 */
function createShortCode(decimals) {
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
					let shortcode = args.value || createShortCode(5);
					logger.info(shhHelpers);
					logger.info('shortcode=', shortcode, 'topic=', shhHelpers.shhHash(shortcode));

					web3.shh.getInfo().then(logger.info);


					web3.shh.generateSymKeyFromPassword(shortcode)
					.then((symKeyID) => {
						logger.info('key ID', symKeyID);
						try {
							logger.info('1');
							var subscription = web3.shh.subscribe('messages', {
								symKeyID: symKeyID,
								topics: [
									//shhHelpers.shhHash(shhHelpers.SshBaseTopic),
									shhHelpers.shhHash(shortcode),
								],
								minPow: 0.3,
							}).on('data', (message) => {
								logger.info('2');
								// if (error) {
								// 	logger.error(error);
								// 	return reject(error);
								// } else {
									// logger.info('******RECEIVED Whisper MSG******');
									// logger.info(message);
									let decoded = web3.utils.hexToAscii(message.payload);
									var payload = JSON.parse(decoded);
									// logger.info('******/RECEIVED Whisper MSG******');
								//}
								//
								socket.emit('sshMessage', payload);
							});


							//.catch((e) => {
							//logger.info('shhsubscribe', subscription);
							resolve({
								initialResponse: {
									shortcode: shortcode,
									//symKeyID: symKeyID,
								},
								cancelSubscription: cancelSubscription,
							});
						} catch (e) {
							logger.info('3');

							logger.error('error subscribe...', e);
							return reject();
						}

						logger.info('4');


						//});
					})
					.catch((e) => {
						logger.error('shhsubscribe', e);
						reject();
						// resolve({
						// 	task: {},
						// 	cancelSubscription: cancelSubscription,
						// });
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
