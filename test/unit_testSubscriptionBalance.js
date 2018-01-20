'use strict';

const should = require('should');

const subscriptionBalance = require('../src/subscriptions/subscriptionBalance')();

describe('subscriptionBalance', function() {
    describe('name', function() {
        it('should have a name', function() {
            should(subscriptionBalance.name).be.equal('balance');
        });
    });

    describe('createSubscription', function() {
        it('should reject when no arguments are passed', function() {
            subscriptionBalance.createSubscription(()=>{}).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            })
            .then((err) => {
                should(err).be.ok;
            });
        });


        it('should reject when no address is passed', function() {
            subscriptionBalance.createSubscription(()=>{}, {}).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            })
            .then((err) => {
                should(err).be.ok;
            });
        });

        it('should reject when an invalid address is passed', function() {
            subscriptionBalance.createSubscription(
                ()=>{}, {'address': 'cofefe'}
            ).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            })
            .then((err) => {
                should(err).be.ok;
            });
        });
    });
});
