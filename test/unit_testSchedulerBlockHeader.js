'use strict';

require('dotenv').config({
	path: '../.env',
});

const should = require('should');

const blockHeaderTask = require('../src/scheduler/blockHeaderTask')();

describe('getBlockNumber', function() {
	it('should return data from the task if present', function() {
        let task = {
            func: () => {},
            responsehandler: () => {},
            data: {
                blockNumber: 12345,
            },
        };
        let blockNumber = blockHeaderTask.getBlockNumber(task);
        should(blockNumber).be.equal(12345);
    });

	it('should return the blockNumber from the module if missing data', function() {
        let task = {
            func: () => {},
            responsehandler: () => {},
            data: {},
        };
        let blockNumber = blockHeaderTask.getBlockNumber(task);
        should(blockNumber).be.equal(0);
    });

	it('should return the blockNumber from the module if no data', function() {
        let task = {
            func: () => {},
            responsehandler: () => {},
        };
        let blockNumber = blockHeaderTask.getBlockNumber(task);
        should(blockNumber).be.equal(0);
    });

	it('should return the blockNumber from the module if no task', function() {
        let blockNumber = blockHeaderTask.getBlockNumber();
        should(blockNumber).be.equal(0);
    });
});
