/**
 * This job will sweep the DB every minute and clean all expired ShortCodes
 */
'use strict';

const logger = require('../logs')(module);
const scheduledTask = require('../scheduler/scheduledTask')();

const dbService = require('../services').dbService;

let task = {
    name: 'shortCodeCleanerTask',
    interval: 60 * 1000,
    func: (task) => {
        logger.info('Sweeping the DB for expired ShortCodes.');
        return new Promise((resolve, reject) => {
            let promises = [];

            dbService.getShortCodes()
                .on('data', (data) => {
                    logger.debug('Found shortcode %j', data);
                    promises.push(new Promise((resolve, reject) => {
                        try {
                            let sc = JSON.parse(data.value);
                            // Has the shortcode expired?
                            if (!sc.validUntil || data.validUntil < (new Date).getTime()) {
                                return dbService.deleteShortCode(sc.shortcode);
                            } else {
                                return Promise.resolve('ShortCode not expired yet.');
                            }
                        } catch(err) {
                            return reject(new Error('Unable to parse shortCode %j', data));
                        }
                    }));
                })
                .on('error', (error) => {
                    logger.error(error);
                })
                .on('close', () => {
                    reject(new Error('Stream of shortCodes closed while reading.'));
                })
                .on('end', () => {
                    logger.debug('All shortcodes were read');

                    Promise.all(promises).then(() => {
                        logger.info('DB was sweeped clean of expired ShortCodes.');
                        resolve();
                    });
                });

        });
    },
};

function start() {
    logger.info('Starting the shortCodeCleaner.');
    return scheduledTask.addTask(task);
}

function stop() {
    logger.info('Stopping the shortCodeCleader.');
    return scheduledTask.removeTask(task);
}

function reset() {
    logger.info('Resetting the shortCodeCleader.');
    return new Promise((resolve, reject) => {
        stop().then(() => {
            resolve(start());
        }).catch((error) => {
            logger.error('Could not stop shortCodeCleaner during reset. Restarting anyway.', error);
            resolve(start());
        });
    });
}

module.exports = {
    start: start,
    stop: stop,
    reset: reset,
};
