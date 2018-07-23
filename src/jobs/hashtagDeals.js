'use strict';

require('../environment');
const logger = require('../logs')(module);
const web3 = require('../globalWeb3').web3;
const scheduledTask = require('../scheduler/scheduledTask')();
const hashtagContract = require('../contracts/hashtagSimpleDeal.json');

const IPFSTask = require('../scheduler/IPFSTask')();

const dbService = require('../services').dbService;
const ipfsService = require('../services').ipfsService;

/**
 * Gets the block height from the blockchain
 *
 * @return     {Promise}  The block height.
 */
function getBlockHeight() {
    return web3.eth.getBlockNumber();
}

/**
 * @param   {Object}    log     Log of a token transfer as returned by the
 *                              contract.
 * @param   {Number}    blockHeight Height of the current block
 * @return  {Object}    Promise that resolves to a SWT log.
 */
async function createItem(log, blockHeight) {
    let block;

    try {
        block = await web3.eth.getBlock(log.blockNumber);
    } catch (e) {
        logger.error(
            'Unable to fetch block to determine time of block. Error: %s',
            e
        );
        block = {
            'dateTime': (new Date).getTime(),
        };
    }

    return {
        'itemHash': log.returnValues.itemHash,
        'hashtagFee': log.returnValues.hashtagFee,
        'ipfsMetadata': log.returnValues.ipfsMetadata,
        /* 'totalValue': log.returnValues.totalValue, */
        'value': log.returnValues.itemValue,
        'seeker': {
            address: log.returnValues.owner,
            username: '',
            avatarHash: '',
            rep: log.returnValues.seekerRep,
        },
        'description': '',
        'dateTime': block.timestamp,
        'location': '',
    };
}

/**
 * Gets the past events.
 *
 * @param      {Number}   startBlock                  The start block
 * @param      {Number}   endBlock                    The end block
 * @param      {Object}   hashtagAddress              The hashtag contract address
 * @param      {Object}   task                        The task
 * @return     {Promise}  The past events.
 */
function getPastEvents(startBlock, endBlock, hashtagAddress, task) {
    return new Promise((resolve, reject) => {
        let startTime = Date.now();
        let hashtagContractInstance = new web3.eth.Contract(
            hashtagContract.abi,
            hashtagAddress
        );
        hashtagContractInstance.getPastEvents('NewItemForTwo', {
            fromBlock: web3.utils.toHex(startBlock),
            toBlock: web3.utils.toHex(endBlock),
        }).then((logs) => {
            let duration = Date.now() - startTime;
            logger.info('Duration %i', duration);

            if (logs && logs.length > 0) {
                for (let i = 0; i < logs.length; i++) {
                    let log = logs[i];

                    createItem(log, log.blockNumber).then((item) => {
                        dbService.setHashtagItem(hashtagAddress, item).then(() => {
                            IPFSTask.addTask({
                                count: 1,
                                func: (task) => {
                                    return ipfsService.cat(task.data.hash, (error, file) => {
                                        if (error) reject(error);
                                        resolve(file.toString('utf8'));
                                    });
                                },
                                responsehandler: async (res, task) => {
                                    if (task.error === 'Error: this dag node is a directory') {
                                        return;
                                    } else if (task.error === 'Error: IPFS request timed out'
                                        || task.error === 'Error: read ECONNRESET') {
                                        task.error = null;
                                        task.count = task.count * 10;
                                        if (task.count > 172800) {
                                            logger.error('Error on hash %s: %s',
                                                task.data.hash,
                                                task.error);
                                            return;
                                        }
                                        task.nextRun = (new Date).getTime() + task.count * 1000;
                                        logger.info('Timeout on hash %s', task.data.hash);
                                        IPFSTask.addTask(task);
                                        return;
                                    } else if (task.error) {
                                        IPFSTask.addTask(task);
                                        return;
                                    }
                                    await dbService.updateHashtagItem(hashtagAddress, item, res);
                                    return;
                                },
                                data: {
                                    hash: item.ipfsMetadata,
                                },
                            });
                        });
                    });
                }
            }

            dbService.setLastHashtagBlock(hashtagAddress, endBlock).then(() => {
                task.interval = 100;
                resolve(duration);
            });
        }).catch((e) => {
            logger.error(e);
            reject(e);
        });
    });
}

/**
 * Start this job
 * @return      {Promise}
 */
function start() {
    let cumulativeEthClientTime = 0;
    let taskStartTime = 0;
    taskStartTime = Date.now();

    // #### Temporal solution
    let hashtagAddress = process.env.HASHTAG_CONTRACT;

    // When we have the list of hashtags it will be necessary to add an
    // array of tasks, one for each hashtag

    return new Promise((jobresolve, reject) => {
        scheduledTask.addTask({
            name: 'hashtagItemsTask-' + hashtagAddress,
            interval: 100,
            func: (task) => {
                return new Promise((resolve, reject) => {
                    dbService.getLastHashtagBlock(hashtagAddress).then((startBlock) => {
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

                                dbService.setHashtagIndexerSynced(hashtagAddress, true).then(() => {
                                    logger.info(
                                        'hashtag %s is synced',
                                        hashtagAddress,
                                        endBlock
                                    );
                                    jobresolve();
                                    return resolve();
                                });
                            }

                            logger.info('scanning %i -> %i (Hashtag %s)',
                                startBlock,
                                endBlock,
                                hashtagAddress);

                            getPastEvents(startBlock, endBlock,
                                hashtagAddress, task).then((scanDuration) => {
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
}

/**
 * Start this job
 * @return      {Promise}
 */
function stop() {
    // TODO
    return new Promise((resolve, reject) => {
        resolve();
    });
}

/**
 * Reset this job
 * @return      {Promise}
 */
function reset() {
    // TODO
    logger.info('Resetting the shortCodeCleader.');
    return new Promise((resolve, reject) => {
        stop().then(() => {
            resolve(start());
        }).catch((error) => {
            logger.error('Could not stop shortCodeCleaner during reset. Restarting anyway.', error);
            resolve(start());
        });
    });
}

module.exports = {
    start: start,
    stop: stop,
    reset: reset,
};
