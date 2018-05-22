'use strict';

// const should = require('should');
// const logger = require('../src/logs')(module);

const hashtagDeals = require('../src/jobs/hashtagDeals');

describe('Test of hashtagDeals job', function() {
    it('should add the task on start', function() {
        return hashtagDeals.start();
    });
});
