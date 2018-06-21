'use strict';

const should = require('should');

const subscriptionTxHistory = require('../src/subscriptions/subscriptionTxHistory')();

describe('subscriptionTxHistory', function() {
    describe('name', function() {
        it('should have a name', function() {
            should(subscriptionTxHistory.name).be.equal('txHistory');
        });
    });

    describe('createSubscription', function() {
        it('should reject when no arguments are passed', function() {
            subscriptionTxHistory.createSubscription(()=>{}).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            })
            .then((err) => {
                should(err).be.ok();
            });
        });


        it('should reject when no address is passed', function() {
            subscriptionTxHistory.createSubscription(()=>{}, {}).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            })
            .then((err) => {
                should(err).be.ok();
            });
        });

        it('should reject when an invalid address is passed', function() {
            subscriptionTxHistory.createSubscription(
                ()=>{}, {'address': 'cofefe'}
            ).then((res) => {
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
