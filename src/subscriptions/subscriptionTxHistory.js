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
 * @param   {String}    publicKey   publicKey being queried for the logs
 * @param   {String}    direction   in or out
 * @param   {Number}    startBlock  Startblock of the SWT contract
 * @param   {Number}    blockNumber Height of the current block
 * @return  {Array}     Array of objects that will resolve to SWT transfer logs.
 */
async function createLogsForDirection(publicKey, direction, startBlock, blockNumber) {
    let logs;

    let filterParam = (direction == 'in' ) ? '_to' : '_from';

    logs = swtContractInstance.getPastEvents('Transfer', {
        'fromBlock': web3.utils.toHex(startBlock),
        'toBlock': blockNumber,
        'filter': {[filterParam]: publicKey},
    });

    let mapped = logs.map((log) => {
        return createTransferLog(log, direction, blockNumber);
    });
    return mapped;
}

/**
 * Get all logs up to the current block for a certain publicKey.
 *
 * @param   {String}    publicKey   publicKey we want the logs for
 * @param   {Number}    endBlock    Block up to which we fetch logs
 * @return  {Array}     Array of objects that will resolve to SWT transfer logs.
 */
async function getPastTransactionHistory(publicKey, endBlock) {
    let startBlock = process.env.SWTSTARTBLOCK;
    let blockNumber = endBlock;

    logger.info(
        'Creating txHistory for %s from block %d to %d',
        publicKey,
        startBlock,
        blockNumber
    );

    let transferLogs = [];

    transferLogs = transferLogs.concat(
        await createLogsForDirection(publicKey, 'out', startBlock, blockNumber)
    );
    transferLogs = transferLogs.concat(
        await createLogsForDirection(publicKey, 'in', startBlock, blockNumber)
    );

    return transferLogs;
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
		return Promise.reject('Cannot subscribe to a transactionHistory without a valid publicKey.');
	}
	logger.info('Subscribing to transactionHistory for %s', args.publicKey);

    // run a task that gets the past tx history for this pubkey
    let _getPastTxHistoryTask = {
        name: 'getPastTxHistoryTask',
        func: async (task) => {
            let endBlock = await web3.eth.getBlockNumber();
            getPastTransactionHistory(task.data.publicKey, endBlock).then((txLog) => {
                Promise.all(txLog).then((values) => {
                    let txHistory = [];

                    values.forEach((log) => {
                        txHistory.push(log);
                    });

                    return dbService.setTransactionHistory(task.data.publicKey, endBlock, txHistory);
                });
            });
        },
        data: {
            publicKey: args.publicKey,
        },
    };
    scheduledTask.addTask(_getPastTxHistoryTask);

    // create task
    let _task = {
        func: (task) => {
            return Promise.resolve(
                dbService.getTransactionHistory(task.data.publicKey).then((res) => {
                    if (!task.data.lastReplyHash) {
                        let replyHash = jsonHash.digest(res);
                        task.data.lastReplyHash = replyHash;
                        logger.debug('no lastReplyhash, setting it to %s', replyHash);
                    }
                    return (res);
                })
            );
		},
		responsehandler: (res, task) => {
			let responseHash = jsonHash.digest(res);
			if (task.data.lastResponse !== responseHash) {
				logger.debug('received modified response RES=%j', res);
				emitToSubscriber('txHistoryChanged', res);
				task.data.lastReplyhash = responseHash;
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
