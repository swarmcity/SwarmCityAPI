/**
 * This module will scan the blockchain for events on the parameter contract and will
 * keep an updated list with hashtags available for the getHashtags task. ( see tasks/ )
 */
'use strict';

require('../environment');
const logger = require('../logs')(module);
const web3 = require('../globalWeb3').web3;
const scheduledTask = require('../scheduler/scheduledTask')();
const hashtagProxyContract = require('../contracts/hashtagProxy.json');

const ipfsService = require('../services').ipfsService;
const dbService = require('../services').dbService;

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
 * @param      {Object}   hashtagProxyContractInstance The parameters contract instance
 * @param      {Object}   task                        The task
 * @return     {Promise}  The past events.
 */
function getPastEvents(startBlock, endBlock, hashtagProxyContractInstance, task) {
	return new Promise((resolve, reject) => {
		let startTime = Date.now();
		hashtagProxyContractInstance.getPastEvents('HashtagSet', {
			fromBlock: web3.utils.toHex(startBlock),
			toBlock: web3.utils.toHex(endBlock),
		})
			.then((logs) => {
				let duration = Date.now() - startTime;
				logger.info('Duration %i', duration);

				if (logs && logs.length > 0) {
					for (let i = 0; i < logs.length; i++) {
						let log = logs[i];
						if (log.returnValues && log.returnValues.name === 'hashtaglist') {
							if (ipfsService.isIPFSHash(log.returnValues.value)) {
								ipfsService.cat(log.returnValues.value).then((data) => {
									data = data.toString();
									logger.info('Found hashtaglist : %j', data);
									dbService.setHashtagList(data).then(() => {
										dbService.setLastBlock(endBlock).then(() => {
											task.interval = 100;
											resolve(duration);
										});
									}).catch((err) => {
										// DB error
										// don't increase the block number & re-schedule for retry
										logger.error(new Error(err));
										task.interval = 1000;
										logger.error(
											'DB put failed. Try again in %i ms.',
											task.interval
										);
										resolve(duration);
									});
								}).catch((err) => {
									// IPFS resolving failed.
									// don't increase the block number & re-schedule for retry
									logger.error(new Error(err));
									task.interval = 1000;
									logger.error(
										'IPFS resolve failed. Try again in %i ms.',
										task.interval
									);
									resolve(duration);
								});
							}
						} else {
							// TODO
							let data = '[{"name":"Settler","deals":5,"id":"0x1c7e651e8ad6b39eb8f8d5a640d64d18a7eeb93d","commission":0.5,"maintainer":"0x369D787F3EcF4a0e57cDfCFB2Db92134e1982e09","contact":[{"name":"hashtagman1@gmail.com","link":"mailto:hashtagman1@gmail.com"},{"name":"@hashtag1 (Twitter)","link":"http://twitter.com/@hashtag1"}]},{"name":"DevOps","deals":64,"id":"1c9v87bc98v7a","commission":0.05,"maintainer":"0x369D787F3EcF4a0e57cDfCFB2Db92134e1982e09","contact":[{"name":"hashtagman2@gmail.com","link":"mailto:hashtagman2@gmail.com"},{"name":"@hashtag2 (Twitter)","link":"http://twitter.com/@hashtag2"}]}]'; // eslint-disable-line max-len

							dbService.setHashtagList(data).then(() => {
								dbService.setLastBlock(endBlock).then(() => {
									task.interval = 100;
									resolve(duration);
								});
							}).catch((err) => {
								// DB error
								// don't increase the block number & re-schedule for retry
								logger.error(new Error(err));
								task.interval = 1000;
								logger.error(
									'DB put failed. Try again in %i ms.',
									task.interval
								);
								resolve(duration);
							});
						}
					}
				} else {
					dbService.setLastBlock(endBlock).then(() => {
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
			logger.info('process.env.HASHTAGPROXYCONTRACT=%s',
				process.env.HASHTAGPROXYCONTRACT);
			logger.info('process.env.HASHTAGPROXYSTARTBLOCK=%s',
				process.env.HASHTAGPROXYSTARTBLOCK);

			let hashtagProxyContractInstance = new web3.eth.Contract(
				hashtagProxyContract.abi,
				process.env.HASHTAGPROXYCONTRACT
			);

			return new Promise((jobresolve, reject) => {
				scheduledTask.addTask({
					name: 'hashtagIndexerTask',
					interval: 100,
					func: (task) => {
						return new Promise((resolve, reject) => {
							dbService.getLastBlock().then((startBlock) => {
								getBlockHeight().then((endBlock) => {
									let range = 30000;
									if (startBlock + range < endBlock) {
										endBlock = startBlock + range;
									}

									// no work to do ? then increase the interval
									// and finish..
									if (startBlock === endBlock) {
										logger.info('at endblock %s', endBlock);
										task.interval = 5000;

										let taskTime = Date.now() - taskStartTime;
										logger.info('++++++++++++++++++++++++++++++');
										logger.info('took %i ms to start', taskTime);
										logger.info(
											'cumulativeEthClientTime %i ms',
											cumulativeEthClientTime
										);
										logger.info('++++++++++++++++++++++++++++++');

										dbService.setHashtagIndexerSynced(true).then(() => {
											logger.info(
												'hashtagindexer is synced',
												endBlock
											);
											jobresolve();
											return resolve();
										});
									}

									logger.info('scanning %i -> %i', startBlock, endBlock);

									getPastEvents(startBlock, endBlock,
										hashtagProxyContractInstance, task).then((scanDuration) => {
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
			logger.info(
				'Reset hashtagsIndexer. SetLastBlock to %i',
				process.env.HASHTAGPROXYSTARTBLOCK
			);
			return dbService.setLastBlock(process.env.HASHTAGPROXYSTARTBLOCK).then(() => {
				dbService.setHashtagIndexerSynced(false).then(() => {
					return this.start();
				});
			});
		},
	});
};
