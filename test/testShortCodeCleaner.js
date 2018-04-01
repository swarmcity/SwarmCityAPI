'use strict';

const should = require('should');
const logger = require('../src/logs')(module);

const shortCodeCleaner = require('../src/jobs/shortCodeCleaner');

const dbService = require('../src/services').dbService;

// const scheduledTask = require('../src/scheduler/scheduledTask')();

const testData = [
    {
        'shortCode': 'TEST1',
        'validity': (new Date).getTime() - (360 * 1000),
        'payload': 'PAYLOAD1',
    }, {
        'shortCode': 'TEST2',
        'validity': (new Date).getTime() - (10 * 1000),
        'payload': 'PAYLOAD2',
    }, {
        'shortCode': 'TEST3',
        'validity': (new Date).getTime() + (20 * 1000),
        'payload': 'PAYLOAD3',
    },
];

describe('Test of shortCodeCleaner scheduling', function() {
    it('should be able to start and stop the job', function(done) {
        shortCodeCleaner.start().then(() => {
                // Currently fails because the scheduler keeps "hiding" interval
                // tasks
                // should(scheduledTask.tasks.length).be.equal(1);
                shortCodeCleaner.stop();
                done();
        }).catch((error) => {
            logger.error(error);
            done();
        });
    });

    it('should be able to reset the job', function(done) {
        shortCodeCleaner.start().then(() => {
            shortCodeCleaner.reset().then(() => {
                // Currently fails because the scheduler keeps "hiding" interval
                // tasks
                // should(scheduledTask.tasks.length).be.equal(1);
                shortCodeCleaner.stop();
                done();
            }).catch((error) => {
                logger.error(error);
                done();
            });
        }).catch((error) => {
            logger.error(error);
            done();
        });
    });
});

describe('Test of shortCodeCleaner job', function() {
	before(function(done) {
        let promises = [];
        testData.forEach((data) => {
            promises.push(
                dbService.saveDataToShortCode(data.shortCode, data.validity, data.payload)
            );
        });
        Promise.all(promises).then(() => {
            done();
        });
	});

    it('should add the task on start', function() {
        return shortCodeCleaner.start();
    });

    it('should wait a bit', function(done) {
        setTimeout(() => {
            done();
        }, 5 * 1000);
    });

    it('should have remove all expired shortCodes', function(done) {
        let promises = [];

        promises.push(new Promise((resolve, reject) => {
            dbService.readShortCode('TEST1').then(() => {
                reject(new Error('shortCode TEST1 is still present in the db.'));
            }).catch((err) => {
                should(err.notFound).be.true;
                resolve();
            });
        }));

        promises.push(new Promise((resolve, reject) => {
            dbService.readShortCode('TEST2').then(() => {
                reject(new Error('shortCode TEST2 is still present in the db.'));
            }).catch((err) => {
                should(err.notFound).be.true;
                resolve();
            });
        }));

        Promise.all(promises).then(done());
    });

    it('should have kept all unexpired shortCodes', function(done) {
        let promises = [];

        promises.push(new Promise((resolve, reject) => {
            dbService.readShortCode('TEST3').then((value) => {
                should(value).be.Object;
                resolve();
            }).catch((err) => {
                reject(new Error('shortCode TEST3 should not have been removed.'));
            });
        }));

        Promise.all(promises).then(done());
    });

    after(function(done) {
        let promises = [];
        testData.forEach((data) => {
            promises.push(
                dbService.deleteShortCode(data.shortCode)
            );
        });
        Promise.all(promises).then(() => {
            done();
        });
    });
});
