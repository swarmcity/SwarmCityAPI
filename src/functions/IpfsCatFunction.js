'use strict';

const logs = require('../logs')(module);

const AbstractFunction = require('./AbstractFunction');

/**
 * Function that gets a file from IPFS
 */
class IpfsCatFunction extends AbstractFunction {
    /**
     * @param   {Object}    scheduledTask       Taskscheduler
     * @param   {Object}    ipfsService         Service object that connects to
     *                                          IPFS
     */
    constructor(scheduledTask, ipfsService) {
        super(
            'ipfscat', [{
                'name': 'hash',
                'description': 'IPFS hash of the file you want to see.',
            }]
        );
        this.scheduledTask = scheduledTask;
        this.ipfsService = ipfsService;
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
                // format the output if requested
                // else return the Buffer
                switch (data.format) {
                    case 'base64':
                    case 'ascii':
                    case 'hex':
                    case 'utf8':
                        res = res.toString(data.format);
                        break;
                }
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
            logs.debug('ipfscat start');
            return this.ipfsService.cat(data.hash);
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


module.exports = IpfsCatFunction;
