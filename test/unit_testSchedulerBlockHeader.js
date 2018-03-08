'use strict';

require('dotenv').config({
	path: '../.env',
});

const logger = require('../src/logs')(module);

const should = require('should');

const blockHeaderTask = require('../src/scheduler/blockHeaderTask')();

describe('getBlockNumber', function() {
	it('should return data from the task if present', function(done) {
        let task = {
            func: () => {},
            responsehandler: () => {},
            data: {
                blockNumber: 12345,
            },
        };
        let blockNumber = blockHeaderTask.getBlockNumber(task);
        should(blockNumber).be.equal(12345);
        done();
    });

	it('should return the blockNumber from the module if missing data', function(done) {
        let task = {
            func: () => {},
            responsehandler: () => {},
            data: {},
        };
        let blockNumber = blockHeaderTask.getBlockNumber(task);
        should(blockNumber).be.equal(0);
        done();
    });

	it('should return the blockNumber from the module if no data', function(done) {
        let task = {
            func: () => {},
            responsehandler: () => {},
        };
        let blockNumber = blockHeaderTask.getBlockNumber(task);
        should(blockNumber).be.equal(0);
        done();
    });

	it('should return the blockNumber from the module if no task', function(done) {
        let task = {
            func: () => {},
            responsehandler: () => {},
        };
        let blockNumber = blockHeaderTask.getBlockNumber();
        should(blockNumber).be.equal(0);
        done();
    });
});
