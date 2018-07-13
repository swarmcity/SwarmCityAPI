'use strict';

const AbstractFunction = require('./AbstractFunction');
const logger = require('../logs.js')(module);
const parseReplyRequest = require('./utils/parseReplyRequest');
const fetchProviderReputationDefault = require('./utils/fetchProviderReputation');

/**
 * Function that reads a ShortCode from the database.
 */
class ReadShortCodeFunction extends AbstractFunction {
    /**
     * @param   {Object}    scheduledTask       Taskscheduler
     * @param   {Object}    dbService           Database service
     * @param   {Object}    fetchProviderReputation Dependency
     */
    constructor(
        scheduledTask,
        dbService,
        fetchProviderReputation = fetchProviderReputationDefault
    ) {
        super(
            'replyRequest', [{
                'name': 'reply',
                'description': 'Object with various necessary info.',
            }]
        );
        this.scheduledTask = scheduledTask;
        this.dbService = dbService;
        this.fetchProviderReputation = fetchProviderReputation;
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
                logger.error('Failed to add reply', task.error);
                let reply = {
                    response: 400,
                    error: 'Failed to add reply: '+task.error,
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
        //     "itemHash": "0xc81f79b9521bd29a12d3e84149c93108ecd4ce5bfa99f91cd244588b5e362967",
        //     "hashtagAddress": "0xeba08e7a1d8145b25c78b473fbc35aa24973d908",
        //     "replier": {
        //         "username": "dapplion",
        //         "avatarHash": "QmWT5xHV1GXgeFBTDfUWtf34JQJtugokK9FtzVQ5r6DPmt",
        //         "address": "0xa5654a8D13619fB9A904647BB5F0015BfE55007d",
        //         "publicKey": "f37d2ba36925f7a4bf647faa703384f31c00bc1cc42780...
        //     },
        //     "decription": "asdd"
        // }
        return async (task) => {
            const args = parseReplyRequest(data.reply);
            const providerRep = await this.fetchProviderReputation(
                args.hashtagAddress,
                args.providerAddress
            );
            const reply = Object.assign(args.replier, {
                reputation: providerRep, // '5'
                description: args.description, // 'I can help you better'
                dateTime: (new Date).getTime()/1000|0, // 1528215492, unix timestamp in seconds
            });
            logger.info('Storing replyRequest for item %s', args.itemHash);
            // Returns the new hashtagItem
            return await this.dbService.addReplyToHashtagItem(
                args.hashtagAddress,
                args.itemHash,
                reply
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

module.exports = ReadShortCodeFunction;
