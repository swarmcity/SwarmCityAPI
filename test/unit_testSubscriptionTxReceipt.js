'use strict';

const should = require('should');

const subscriptionTxReceipt = require('../src/subscriptions/subscriptionTxReceipt');

describe('subscriptionTxReceipt', function() {
    describe('name', function() {
        it('should have a name', function() {
            should(subscriptionTxReceipt.name).be.equal('txReceipt');
        });
    });

    describe('createSubscription', function() {
        it('should reject when no arguments are passed', function() {
            subscriptionTxReceipt.createSubscription(()=>{}).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            })
            .then((err) => {
                should(err).be.ok();
            });
        });


        it('should reject when no transactionHash is passed', function() {
            subscriptionTxReceipt.createSubscription(()=>{}, {}).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            })
            .then((err) => {
                should(err).be.ok();
            });
        });
    });
});
