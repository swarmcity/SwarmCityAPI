/**
 * This module will scan the blockchain for events on the parameter contract and will
 * keep an updated list with hashtags available for the getHashtags task. ( see tasks/ )
 */
'use strict';

require('../environment');
const logger = require('../logs')('jobs/hashtagsIndexer');
const db = require('../connections/db').db;
const web3 = require('../globalWeb3').web3;
const scheduledTask = require('../scheduler/scheduledTask')();
const parametersContract = require('../contracts/Parameters.json');

const ipfsService = require('../services').ipfsService;

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

/**
 * Gets the past events.
 *
 * @param      {Number}   startBlock                  The start block
 * @param      {Number}   endBlock                    The end block
 * @param      {Object}   parametersContractInstance  The parameters contract instance
 * @param      {Object}   task                        The task
 * @return     {Promise}  The past events.
 */
function getPastEvents(startBlock, endBlock, parametersContractInstance, task) {
	return new Promise((resolve, reject) => {
		let startTime = Date.now();
		parametersContractInstance.getPastEvents('ParameterSet', {
				fromBlock: web3.utils.toHex(startBlock),
				toBlock: web3.utils.toHex(endBlock),
			})
			.then((logs) => {
				let duration = Date.now() - startTime;
				logger.info('duration', duration);

				if (logs && logs.length > 0) {
					for (let i = 0; i < logs.length; i++) {
						let log = logs[i];
						if (log.returnValues && log.returnValues.name === 'hashtaglist') {
							if (ipfsService.isIPFSHash(log.returnValues.value)) {
								ipfsService.cat(log.returnValues.value).then((data) => {
									data = data.toString();
									logger.info('found hashtaglist : ', data);
									db.put(process.env.PARAMETERSCONTRACT +
										'-hashtaglist', data).then(() => {
										setLastBlock(endBlock).then(() => {
											task.interval = 100;
											resolve(duration);
										});
									}).catch((err) => {
										// DB error
										// don't increase the block number & re-schedule for retry
										logger.error(new Error(err));
										logger.error('DB put failed. Try again in 1s');
										task.interval = 1000;
										resolve(duration);
									});
								}).catch((err) => {
									// IPFS resolving failed.
									// don't increase the block number & re-schedule for retry
									logger.error(new Error(err));
									logger.error('IPFS resolve failed. Try again in 1s');
									task.interval = 1000;
									resolve(duration);
								});
							}
						}
					}
				} else {
					setLastBlock(endBlock).then(() => {
						task.interval = 100;
						resolve(duration);
					});
				}
			}).catch((e) => {
				logger.error(e);
				reject(e);
			});
	});
}

module.exports = function() {
	let cumulativeEthClientTime = 0;
	let taskStartTime = 0;
	return ({
		start: function() {
			taskStartTime = Date.now();

			// start up this task... print some parameters
			logger.info('process.env.PARAMETERSCONTRACT=',
				process.env.PARAMETERSCONTRACT);
			logger.info('process.env.PARAMETERSCONTRACTSTARTBLOCK=',
				process.env.PARAMETERSCONTRACTSTARTBLOCK);

			let parametersContractInstance = new web3.eth.Contract(
				parametersContract.abi,
				process.env.PARAMETERSCONTRACT
			);

			return new Promise((jobresolve, reject) => {
				scheduledTask.addTask({
					name: 'hashtagIndexerTask',
					interval: 100,
					func: (task) => {
						return new Promise((resolve, reject) => {
							getLastBlock().then((startBlock) => {
								getBlockHeight().then((endBlock) => {
									let range = 30000;
									if (startBlock + range < endBlock) {
										endBlock = startBlock + range;
									}

									// no work to do ? then increase the interval
									// and finish..
									if (startBlock === endBlock) {
										logger.info('at endblock', endBlock);
										task.interval = 5000;

										let taskTime = Date.now() - taskStartTime;
										logger.info('++++++++++++++++++++++++++++++');
										logger.info('took', taskTime, 'ms to start');
										logger.info('cumulativeEthClientTime',
											cumulativeEthClientTime, 'ms');
										logger.info('++++++++++++++++++++++++++++++');

										db.put('hashtagindexer-synced', true).then(() => {
											logger.info('hashtagindexer is synced', endBlock);
											jobresolve();
											return resolve();
										});
									}

									logger.info('scanning', startBlock, '->', endBlock);

									getPastEvents(startBlock, endBlock,
										parametersContractInstance, task).then((scanDuration) => {
										cumulativeEthClientTime += scanDuration;
										resolve();
									});
								}).catch((e) => {
									logger.error(e);
									reject(e);
								});
							}).catch((e) => {
								logger.error(e);
								reject(e);
							});
						});
					},
				});
			});
		},

		stop: function() {
			return new Promise((resolve, reject) => {
				resolve();
			});
		},

		reset: function() {
			logger.info('reset : setLastBlock to ', process.env.PARAMETERSCONTRACTSTARTBLOCK);
			return setLastBlock(process.env.PARAMETERSCONTRACTSTARTBLOCK).then(() => {
				db.put('hashtagindexer-synced', false).then(() => {
					return this.start();
				});
			});
		},
	});
};
