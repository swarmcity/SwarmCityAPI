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

/**
 * Sets the last block.
 *
 * @param      {Number}  blockNumber  The block number
 * @return     {promise}  promise
 */
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
									};

									logger.info('params=', o);

									web3.eth.getPastLogs(o)
										.then((logs) => {
											if (logs && logs.length > 0) {
												logger.info('I HAZ A LOG');
												logger.info(logs);
console.log(logs);
											}

											setLastBlock(endBlock).then(() => {
												task.interval = 100;
												resolve();
											});
										});
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
				});
			});
		},

		stop: function() {
			return new Promise((resolve, reject) => {
				resolve();
				// subscription.unsubscribe(function(error, success) {
				// 	if (success)
				// 		console.log('Successfully unsubscribed!');
				// 	resolve();
				// });
			});
		},

		reset: function() {
			return setLastBlock(process.env.PARAMETERSCONTRACTSTARTBLOCK).then(() => {
				return this.start();
			});
		},

	});
}
