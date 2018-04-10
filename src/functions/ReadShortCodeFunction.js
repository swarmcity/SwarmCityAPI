'use strict';

const AbstractFunction = require('./AbstractFunction');

/**
 * Function that reads a ShortCode from the database.
 */
class ReadShortCodeFunction extends AbstractFunction {
    /**
     * @param   {Object}    scheduledTask       Taskscheduler
     * @param   {Object}    dbService           Database service
     */
    constructor(scheduledTask, dbService) {
        super(
            'readShortCode', [{
                'name': 'shortCode',
                'description': 'ShortCode you want to read.',
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
					data: {
						address: res.address,
                        userName: res.userName,
                        avatar: res.avatar,
					},
                };
                return callback(reply);
            } else {
                let reply = {
                    response: 400,
                    error: 'ShortCode ' + data.shortCode + ' not found.',
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
            return this.dbService.readShortCode(data.shortCode);
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

module.exports = ReadShortCodeFunction;
