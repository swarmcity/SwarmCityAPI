'use strict';

const AbstractFunction = require('./AbstractFunction');
const logger = require('../logs.js')(module);
const parseSelectProvider = require('./utils/parseSelectProvider');

/**
 * Function that adds a selectee to a hashtagItem in the database.
 */
class SelectProviderFunction extends AbstractFunction {
    /**
     * @param   {Object}    scheduledTask       Taskscheduler
     * @param   {Object}    dbService           Database service
     */
    constructor(
        scheduledTask,
        dbService,
    ) {
        super(
            'selectProvider', [{
                'name': 'selectee',
                'description': 'Object with various necessary info.',
            }]
        );
        this.scheduledTask = scheduledTask;
        this.dbService = dbService;
    }

    /**
     * returns the function output to the client
     *
     * @param   {Object}    data        The data that was passed to the function.
     * @param   {Function}  callback    The callback for output
     * @return  {Funcion}   Anonymous function that takes a result and a task,
     *                      generates a response object and hands that to the
     *                      passed callback.
     */
    responseHandler(data, callback) {
        return (res, task) => {
            if (task.success && res) {
                // Respond to the callback tied to the client socket
                let reply = {
                    response: 200,
                    data: res, // return the entire hashtagItem object
                };
                return callback(reply);
            } else {
                logger.error('Failed to add selectee', task.error);
                let reply = {
                    response: 400,
                    error: 'Failed to add selectee: '+task.error,
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
        // Example of data.reply
        // {
        //     'itemHash': '0x06d0540d044ea8d6efd0a994c5235aebaa414607c632f6f0f1b5d6ea658a829a',
        //     'hashtagAddress': '0xeba08e7a1d8145b25c78b473fbc35aa24973d908',
        //     'selectee': {
        //         'secret': '<String>', // the ID of the item (not the hash)...
        //         'address': '0xeba08e7a1d8145b25c78b473fbc35aa24973d908', // the ETH address
        //     },
        //     'reply': {
        //         'dateTime': 12345,
        //         'username': 'Tester Y',
        //         'avatarHash': '<base64>',
        //         'publicKey': 'abc1234...', // the full Ethereum public key
        //         'address': '0x123...abc', // the ETH address
        //         'reputation': '<String>', // the ProviderRep balance on this hashtag
        //         'description': '<String>', // the reply msg
        //     },
        // }
        return async (task) => {
            const args = parseSelectProvider(data.selectee);
            const selectee = Object.assign(args.selectee, {
                reply: args.reply,
            });
            logger.info('Storing selectee for item %s', args.itemHash);
            // Returns the new hashtagItem
            return await this.dbService.addSelecteeToHashtagItem(
                args.hashtagAddress,
                args.itemHash,
                selectee
            );
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

module.exports = SelectProviderFunction;
