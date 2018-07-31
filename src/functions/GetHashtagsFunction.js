'use strict';

const AbstractFunction = require('./AbstractFunction');

/**
 * Function that reads a ShortCode from the database.
 */
class GetHashtagsFunction extends AbstractFunction {
    /**
     * @param   {Object}    scheduledTask       Taskscheduler
     * @param   {Object}    dbService           Database service
     */
    constructor(scheduledTask, dbService) {
        super(
            'getHashtags', []
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
        return (hashtags, task) => {
            if (task.success && hashtags) {
                let reply = {
                    response: 200,
                    data: hashtags,
                };
                return callback(reply);
            } else {
                let reply = {
                    response: 400,
                    error: 'Error getting hashtags ',
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
            return this.dbService.getHashtags()
            .then((allHashtags) => allHashtags.filter((hashtag) => hashtag.hashtagShown));
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

module.exports = GetHashtagsFunction;
