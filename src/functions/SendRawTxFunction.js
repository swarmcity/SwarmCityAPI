'use strict';

'use strict';

const logs = require('../logs')(module);

const AbstractFunction = require('./AbstractFunction');

const scheduledTask = require('../scheduler/scheduledTask')();
const ethereumjsutil = require('ethereumjs-util');

/**
 * Function that sends a raw transaction to the blockchain.
 */
class SendRawTxFunction extends AbstractFunction {
    /**
     * @param   {Object}    scheduledTask       Taskscheduler
     * @param   {Object}    web3                Web3 connection
     */
    constructor(scheduledTask, web3) {
        super(
            'sendRawTx', [{
                'name': 'tx',
                'description': 'Raw transaction you want to send.',
            }]
        );
        this.scheduledTask = scheduledTask;
        this.web3 = web3;
    }

    /**
     * returns the function output to the client
     *
     * @param   {Object}    data        The data that was passed to the
     *                                  function.
     * @param   {Function}  callback    The callback for output
     * @return  {Funcion}   Anonymous function that takes a result and a task,
     *                      generates a response object and hands that to the
     *                      passed callback.
     */
    responseHandler(data, callback) {
        return (res, task) => {
            if (task.success && res) {
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
        };
    }

    /**
     * Get the  function runner
     *
     * @param   {Object}    data    Data needed to actually run the task
     * @return  {Function}  The actual function that will be called when the
     *                      task is run
     */
    func(data) {
        return (task) => {
            logs.info('sendRawTx start');
            return new Promise((resolve, reject) => {
                if (!data.tx) {
                    reject(new Error('No tx present. Can\'t send.'));
                }
                let tx = ethereumjsutil.addHexPrefix(data.tx);
                logs.debug('Sending signed transaction: %s', tx);
                web3.eth.sendSignedTransaction(tx)
                    .once('transactionHash', (hash) => {
                        logs.debug('transactionHash %s', hash);
                        resolve({'transactionHash': hash});
                    })
                    .on('error', (err, receipt) => {
                        if (err.message &&
                            err.message.startsWith('Failed to check for transaction receipt')
                           ) {
                            logs.debug('Another complaint about the receipt ignored.');
                        } else {
                            logs.error(err);
                            if (receipt) {
                                logs.error('We might be out of Gas: %j', receipt);
                            }
                            reject(new Error('Transaction error: ' + err));
                        }
                    });
            });
        };
    }

    /**
     * create and execute the task
     *
     * @param      {Object}    socket    The socket
     * @param      {Object}    data      The data
     * @param      {Function}  callback  The callback
     */
    createTask(socket, data, callback) {
        this.scheduledTask.addTask({
            name: this.name(),
            func: this.func(data),
            responsehandler: this.responseHandler(data, callback),
            data: {
                socket: socket,
            },
        });
    }
}

module.exports = SendRawTxFunction;
