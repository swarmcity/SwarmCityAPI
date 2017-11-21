/**
 * This module will scan the blockchain for events on the parameter contract and will 
 * keep an updated list with hashtags available for the getHashtags task. ( see tasks/ )
 */
'use strict';

require('../environment');
const logger = require('../logs')('hashtagIndexer');
const db = require('../globaldb').db;
const web3 = require('../globalWeb3').web3;
const scheduledTask = require('../scheduler/scheduledtask')();

/**
 * Returns last processed block of the parameters contract
 * ( or the deployment block if not initialized yet...)
 *
 * @return     {Promise}  The last block.
 */
function getLastBlock() {
	return new Promise((resolve, reject) => {
		db.get('lastblock-' + process.env.PARAMETERSCONTRACT, function(err, value) {
			if (err) {
				if (err.notFound) {
					// handle a 'NotFoundError' here
					resolve(parseInt(process.env.PARAMETERSCONTRACTSTARTBLOCK));
				}
				// I/O or other error, pass it up the callback chain
				reject();
			}
			resolve(parseInt(value));
		});
	});
}

function setLastBlock(blockNumber) {
	return db.put('lastblock-' + process.env.PARAMETERSCONTRACT, blockNumber);
}

/**
 * Gets the block height from the blockchain
 *
 * @return     {Promise}  The block height.
 */
function getBlockHeight() {
	return web3.eth.getBlockNumber();
}



module.exports = function() {
	let subscription;
	return ({
		start: function() {

			// start up this task... print some parameters
			logger.info('process.env.PARAMETERSCONTRACT=', process.env.PARAMETERSCONTRACT);
			logger.info('process.env.PARAMETERSCONTRACTSTARTBLOCK=', process.env.PARAMETERSCONTRACTSTARTBLOCK);


			return new Promise((resolve, reject) => {

				scheduledTask.addTask({
					name: 'hashtagIndexerTask',
					interval: 100,
					func: (task) => {
						return new Promise((resolve, reject) => {
							getLastBlock().then((startBlock) => {
								getBlockHeight().then((endBlock) => {

									let range = 100;
									if (startBlock + range < endBlock) {
										endBlock = startBlock + range;
									}

									// no work to do ? then increase the interval
									// and finish..
									if (startBlock === endBlock) {
										logger.info('at endblock', endBlock);
										task.interval = 5000;
										return resolve();
									}

									logger.info('scanning', startBlock, '->', endBlock);

									let o = {
										address: process.env.PARAMETERSCONTRACT,
										fromBlock: web3.utils.toHex(startBlock),
										toBlock: web3.utils.toHex(endBlock),
										//											topics: ["0x033456732123ffff2342342dd12342434324234234fd234fd23fd4f23d4234"]
									};

									logger.info('params=', o);

									web3.eth.getPastLogs(o)
										.then((logs) => {
											logger.info('I HAZ A LOG');
											logger.info(logs);

											setLastBlock(endBlock).then(() => {
												task.interval = 100;
												resolve();
											});
										});

									// subscription = web3.eth.subscribe('logs', {
									// 		//address: '' + process.env.PARAMETERSCONTRACT,
									// 		//fromBlock: process.env.PARAMETERSCONTRACTSTARTBLOCK,
									// 		//topics: ['0x52416347a4aa65bcdcfb6915eafb20dc1aad86e01ec22e5bd8cc35b149714c63']
									// 	}, function(error, result) {
									// 		logger.info('subscription DONE');
									// 		logger.info(err, result);
									// 		resolve();
									// 	}).on("data", function(log) {
									// 		logger.info('DATA', log);
									// 	})
									// 	.on("changed", function(log) {
									// 		logger.info('DATA', log);
									// 	});
									// logger.info(subscription, subscription);

								}).catch((e) => {
									logger.error(e);
									reject(e);
								});
							}).catch((e) => {
								logger.error(e);
								reject(e);
							});;

						});
					},
					// responsehandler: (res, task) => {

					// 	//return blockHeaderTask.addTask(task);
					// 	logger.info('subscription created', subscription);
					// 	resolve();
					// }
				});
			});
		},

		stop: function() {
			return new Promise((resolve, reject) => {
				subscription.unsubscribe(function(error, success) {
					if (success)
						console.log('Successfully unsubscribed!');
					resolve();
				});

			});
		},

	});
}
