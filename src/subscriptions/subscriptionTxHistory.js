/**
 * Subscription manager for 'transaction history' of an account
 */
'use strict';
const logger = require('../logs.js')(module);
const validate = require('../validators');
const jsonHash = require('json-hash');
const scheduledTask = require('../scheduler/scheduledTask')();
const blockHeaderTask = require('../scheduler/blockHeaderTask')();
const web3 = require('../globalWeb3').web3;

const dbService = require('../services').dbService;

const swtContract = require('../contracts/miniMeToken.json');
const swtContractInstance = new web3.eth.Contract(
    swtContract.abi,
    process.env.SWT
);

/**
 * @param   {Object}    log     Log of a token transfer as returned by the
 *                              contract.
 * @param   {String}    direction   in or out
 * @param   {Number}    blockHeight Height of the current block
 * @return  {Object}    Promise that resolves to a SWT log.
 */
async function createTransferLog(log, direction, blockHeight) {
    let block;

    block = await web3.eth.getBlock(log.blockNumber);

    return {
        'transactionHash': log.transactionHash,
        'blockNumber': log.blockNumber,
        'dateTime': block.timestamp,
        'direction': direction,
        'amount': log.returnValues._amount / 10 ** 18,
        'symbol': 'SWT',
        'from': log.returnValues._from,
        'to': log.returnValues._to,
        'confirmed': blockHeight - log.blockNumber >= 12,
    };
}

/**
 * Create incoming or outgoing logs in a block range
 *
 * @param   {String}    publicKey   publicKey being queried for the logs
 * @param   {String}    direction   in or out
 * @param   {Number}    startBlock  Start querying from here
 * @param   {Number}    endBlock    Stop querying here
 * @return  {Array}     Array of objects that will resolve to SWT transfer logs.
 */
async function createLogsForDirection(publicKey, direction, startBlock, endBlock) {
    let logs;

    let filterParam = (direction == 'in' ) ? '_to' : '_from';

    logs = swtContractInstance.getPastEvents('Transfer', {
        'fromBlock': web3.utils.toHex(startBlock),
        'toBlock': web3.utils.toHex(endBlock),
        'filter': {[filterParam]: publicKey},
    });

    let mapped = logs.map((log) => {
        return createTransferLog(log, direction, endBlock);
    });
    return mapped;
}

/**
 * Get all logs up to the current block for a certain publicKey.
 *
 * @param   {String}    publicKey   publicKey we want the logs for
 * @param   {Number}    startBlock  Block starting from which to fetch logs
 * @param   {Number}    endBlock    Block up to which we fetch logs
 * @return  {Array}     Array of objects that will resolve to SWT transfer logs.
 */
async function getTransactionHistory(publicKey, startBlock, endBlock) {
    logger.info(
        'Creating txHistory for %s from block %d to %d',
        publicKey,
        startBlock,
        endBlock
    );

    let transferLogs = [];

    transferLogs = transferLogs.concat(
        await createLogsForDirection(publicKey, 'out', startBlock, endBlock)
    );
    transferLogs = transferLogs.concat(
        await createLogsForDirection(publicKey, 'in', startBlock, endBlock)
    );

    return transferLogs;
}

/**
 * Check every log and try to confirm it if not already confirmed.
 *
 * @param   {Array}     transactionHistory  Log of all transactions undertaken
 *                                          by a user.
 * @param   {Number}    currentBlock        Number of the current block
 * @return  {Array}     All transactions with the confirmed value updated.
 */
function updateConfirmations(transactionHistory, currentBlock) {
    return transactionHistory.map((log) => {
        if (!log.confirmed) {
            log.confirmed = currentBlock - log.blockNumber >= 12;
        }
        return log;
    });
}

/**
 * Sort the log chronologically.
 * @param   {Array}     transactionHistory  Log of all transactions undertaken
 *                                          by a user.
 * @return  {Array}     All transactions sorted chronologically.
 */
function sortLog(transactionHistory) {
    return transactionHistory.sort((a, b) => {
        let comp = 0;
        if (a.dateTime > b.dateTime) {
            comp = -1;
        } else if (a.dateTime < b.dateTime) {
            comp = 1;
        }
        return comp;
    });
}

/**
 * clean up a task from the scheduler when socket wants to unsubscribe
 *
 * @param      {Object}   task    The task
 * @return     {Promise}  result of removing the task (no return value)
 */
function cancelSubscription(task) {
    return dbService.deleteTransactionHistory(task.data.publicKey);
}

/**
 * Creates a subscription.
 *
 * @param      {Function} 	emitToSubscriber the function to call when you want to emit data
 * @param      {Object}  	args    The parameters sent with the subscription
 * @return     {Promise}  	resolves with the subscription object
 */
function createSubscription(emitToSubscriber, args) {
	// check arguments
	if (!args || !args.publicKey || !validate.isAddress(args.publicKey)) {
		return Promise.reject(
            'Cannot subscribe to a transactionHistory without a valid publicKey.'
        );
	}
	logger.info('Subscribing to transactionHistory for %s', args.publicKey);

    // run a task that gets the past tx history for this pubkey
    let _getPastTxHistoryTask = {
        name: 'getPastTxHistoryTask',
        func: async (task) => {
            let startBlock = process.env.SWTSTARTBLOCK;
            let endBlock = await web3.eth.getBlockNumber();

            let txLog = [];
            txLog = await getTransactionHistory(task.data.publicKey, startBlock, endBlock);

            let txHistory = [];
            await Promise.all(txLog);

            txLog.forEach((log) => {
                txHistory.push(log);
            });

            txHistory = sortLog(txHistory);

            return dbService.setTransactionHistory(
                task.data.publicKey,
                endBlock,
                txHistory
            );
        },
        data: {
            publicKey: args.publicKey,
        },
    };
    scheduledTask.addTask(_getPastTxHistoryTask);

    // create task
    let _task = {
        func: async (task) => {
            let result = {};
            result = await dbService.getTransactionHistory(task.data.publicKey);

            if (!task.data.lastReplyHash) {
                let replyHash = jsonHash.digest(result.transactionHistory);
                task.data.lastReplyHash = replyHash;
                logger.debug('no lastReplyhash, setting it to %s', replyHash);
            }

            let startBlock = result.endBlock + 1;
            let endBlock = await web3.eth.getBlockNumber();
            if (startBlock < endBlock) {
                // Let's see if anything happened in this blockrange
                let txLog = [];
                txLog = await getTransactionHistory(task.data.publicKey, startBlock, endBlock);

                let transactionHistory = result.transactionHistory;

                await Promise.all(txLog);

                if (txLog.length > 0) {
                    // Our user did something, update the database
                    txLog.forEach((log) => {
                        transactionHistory.push(log);
                    });
                    transactionHistory = sortLog(transactionHistory);
                    await dbService.setTransactionHistory(
                        task.data.publicKey,
                        endBlock,
                        transactionHistory
                    );
                    result = await dbService.getTransactionHistory(task.data.publicKey);
                }
            }
            result.transactionHistory = updateConfirmations(result.transactionHistory, endBlock);
            return result.transactionHistory;
		},
		responsehandler: (res, task) => {
			let replyHash = jsonHash.digest(res);
			if (task.data.lastReplyHash !== replyHash) {
				logger.debug('received modified response RES=%j', res);
				emitToSubscriber('txHistoryChanged', res);
				task.data.lastReplyhash = replyHash;
			} else {
				logger.info('Data hasn\'t changed.');
			}
			return blockHeaderTask.addTask(task);
		},
		data: {
			publicKey: args.publicKey,
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
		name: 'txHistory',
		createSubscription: createSubscription,
	});
};
