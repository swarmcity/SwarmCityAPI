/**
 * This job will sweep the DB every minute and clean all expired ShortCodes
 */
'use strict';

const logger = require('../logs')(module);
const scheduledTask = require('../scheduler/scheduledTask')();

const dbService = require('../services').dbService;

let task = {
    nextRun: (new Date).getTime() + (2 * 1000),
    name: 'shortCodeCleanerTask',
    interval: 60 * 1000,
    func: (task) => {
        return new Promise((resolve, reject) => {
            let promises = [];

            dbService.getShortCodes()
                .on('data', (data) => {
                    logger.debug('Found ShortCode %j', data);
                    promises.push(new Promise((resolve, reject) => {
                        try {
                            let sc = JSON.parse(data.value);
                            // Has the ShortCode expired?
                            if (!sc.validUntil || sc.validUntil < (new Date).getTime()) {
                                return dbService.deleteShortCode(sc.shortCode);
                            } else {
                                return Promise.resolve('ShortCode not expired yet.');
                            }
                        } catch (err) {
                            return reject('Unable to parse shortCode '+JSON.stringify(data));
                        }
                    }));
                })
                .on('error', (error) => {
                    logger.error(error);
                })
                .on('close', () => {
                    resolve();
                })
                .on('end', () => {
                    logger.debug('All ShortCodes were read');

                    Promise.all(promises).then(() => {
                        resolve();
                    });
                });
        });
    },
};

/**
 * Start this job
 * @return      {Promise}
 */
function start() {
    logger.info('Starting the shortCodeCleaner.');
    return scheduledTask.addTask(task);
}

/**
 * Start this job
 * @return      {Promise}
 */
function stop() {
    logger.info('Stopping the shortCodeCleader.');
    return scheduledTask.removeTask(task);
}

/**
 * Reset this job
 * @return      {Promise}
 */
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
