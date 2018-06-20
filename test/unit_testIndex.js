'use strict';

const should = require('should');

const subscriptionIndex = require('../src/subscriptions/index')();

describe('subscriptionIndex', function() {
    describe('status', function() {
        it('should give the status', function() {
            subscriptionIndex.status().then(() => {
                return Promise.resolve('ok');
            }).then((res) => {
                should(res).be.ok();
            });
        });
    });
});
