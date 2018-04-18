'use strict';

const logs = require('../logs')(module);

const AbstractFunction = require('./AbstractFunction');

const sendSignedTransactionTask = require('../tasks/sendSignedTransaction')();

/**
 * Function that sends a raw transaction to the blockchain.
 */
class ReplyShortCodeFunction extends AbstractFunction {
    /**
     * @param   {Object}    scheduledTask       Taskscheduler
     * @param   {Object}    dbService           Database service
     */
    constructor(scheduledTask, dbService) {
        super(
            'replyShortCode', [{
                'name': 'shortCode',
                'description': 'shortCode to reply',
            }, {
                'name': 'tx',
                'description': 'Raw transaction you want to send.',
            }]
        );
        this.scheduledTask = scheduledTask;
        this.dbService = dbService;
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
                    data: task.error,
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
            logs.info('ReplyShortCodeFunction start');
            return new Promise((resolve, reject) => {
                this.dbService.readShortCode(data.shortCode, true).then((res) => {
                    // The generated code is single-use , we never will re-use a shortcode.
                    // Not when it expires , and not when the request was canceled.
                    this.dbService.deleteShortCode(data.shortCode).then((res) => {
                        sendSignedTransactionTask.sendSignedTransaction(data).then((tx) =>{
                            resolve(tx);
                        }).catch((error) => {
                            reject(error);
                        });
                    }).catch((error) => {
                        reject(error);
                    });
                }).catch((error) => {
                    reject(error);
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

module.exports = ReplyShortCodeFunction;
