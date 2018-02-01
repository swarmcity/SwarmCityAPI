'use strict';
const scheduledTask = require('../scheduler/scheduledTask')();
const logs = require('../logs')(module);
const web3 = require('../globalWeb3').web3;
const ethereumjsutil = require('ethereumjs-util');

/**
 * returns name (verb) of this function
 * @return     {null}   none
 */
function name() {
	return 'sendRawTx';
}

/**
 * create and execute the task
 *
 * @param      {Object}    socket    The socket
 * @param      {Object}    data      The data
 * @param      {Function}  callback  The callback
 */
function createTask(socket, data, callback) {
	scheduledTask.addTask({
		func: (task) => {
			logs.info('sendRawTx start');
			return new Promise((resolve, reject) => {
                if (!data.tx) {
                    reject(new Error('No tx present. Can\'t send.'));
                }
                let tx = ethereumjsutil.addHexPrefix(data.tx);
                logs.debug('Sending signed transaction: %s', tx);
				web3.eth.sendSignedTransaction(tx)
                    .on('transactionHash', (hash) => {
                        logs.debug('transactionHash %s', hash);
                    })
                    .on('confirmation', (confNumber, receipt) => {
                        logs.debug('confirmation: %d', confNumber);
                        logs.debug('receipt %j', receipt);
                    })
                    .on('error', (err) => {
                        logs.error(err);
                        reject(new Error('Transaction error: %s', err));
                    })
                    .then((receipt) => {
                        logs.debug('receipt %j', receipt);
                        resolve(receipt);
                    });
			});
		},
		responsehandler: (res, task) => {
			if (task.success) {
				let reply = {
					response: 200,
					data: res,
				};
				return callback(reply);
			} else {
				let reply = {
					response: 500,
					data: res,
					error: task.error,
				};
				return callback(reply);
			}
		},
		data: {
			socket: socket,
		},
	});
}

module.exports = {
	name: name,
	createTask: createTask,
};
