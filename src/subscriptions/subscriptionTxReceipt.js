/**
 * Subscription manager for 'txReceipt'
 */
'use strict';

const logs = require('../logs.js')(module);

const jsonHash = require('json-hash');

const web3 = require('../globalWeb3').web3;
const blockHeaderTask = require('../scheduler/blockHeaderTask')();

/**
 * clean up a task from the scheduler when socket wants to unsubscribe
 *
 * @param      {Object}   task    The task
 * @return     {Promise}  result of removing the task (no return value)
 */
function cancelSubscription(task) {
    return Promise.resolve(
        blockHeaderTask.removeTask(task)
    );
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
 * @param   {String}    transactionHash
 * @return  {Promise}   A promise that resolves a modified receipt or rejects
 *                      with an error.
 */
function getReceipt(transactionHash) {
    return new Promise((resolve, reject) => {
        logs.info('Getting receipt for %s', transactionHash);
        web3.eth.getTransactionReceipt(transactionHash)
        .then((receipt) => {
            logs.debug('Receipt received: %j', receipt);
            let res = {};
            if (receipt === null) {
                res.status = 'Pending';
                res.receipt = {};
            } else {
                res.receipt = receipt;
                let statemap = {
                    '0x0': 'Fail',
                    '0x1': 'Success',
                };
                res.status = statemap[receipt.status] || 'Unknown';
            }
            resolve(res);
        })
        .catch((error) => {
            logs.error('Tried to get receipt, but got this:  %s', error);
            if (error.message.includes('unknown transaction')) {
                let res = {};
                res.status = 'Pending';
                res.receipt = {};
                resolve(res);
            }
            reject(error);
        });
    });
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
	if (!args || !args.transactionHash) {
		return Promise.reject('Cannot subscribe to a receipt without a valid transactionHash.');
	}
	logs.info('Subscribing to receipt for %s', args.transactionHash);

    // create task
    let _task = {
        name: 'txReceipt',
        func: (task) => {
            return new Promise((resolve, reject) => {
                let promises = [getReceipt(task.data.transactionHash), getBlockHeight()];
                Promise.all(promises).then((values) => {
                    let res = values[0];
                    let blockHeight = values[1];
                    if (!res.receipt.blockNumber) {
                        res.confirmations = 0;
                    } else {
                        res.confirmations = blockHeight - res.receipt.blockNumber;
                    }
                    if (!task.data.lastReplyHash) {
                        let replyHash = jsonHash.digest(res);
                        task.data.lastReplyHash = replyHash;
                        logs.debug('no lastReplyhash, setting it to %s', replyHash);
                    }
                    resolve(res);
                })
                .catch((error) => {
                    logs.error(error);
                    reject(error);
                });
            });
        },
        responsehandler: (res, task) => {
            logs.debug('received txReceipt RES=%j', res);
            let replyHash = jsonHash.digest(res);
            if (task.data.lastReplyHash !== replyHash) {
                logs.info('txReceipt => data has changed. New value: %j', res);
                emitToSubscriber('txReceiptChanged', res);
                task.data.lastReplyHash = replyHash;
            } else {
                logs.info('txReceipt => data hasn\'t changed.');
            }
            return blockHeaderTask.addTask(task);
        },
        data: {
            transactionHash: args.transactionHash,
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

module.exports = {
    name: 'txReceipt',
    createSubscription: createSubscription,
};
