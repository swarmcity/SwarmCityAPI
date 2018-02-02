'use strict';

const should = require('should');

const subscriptionNonce = require('../src/subscriptions/subscriptionNonce')();

describe('subscriptionNonce', function() {
    describe('name', function() {
        it('should have a name', function() {
            should(subscriptionNonce.name).be.equal('nonce');
        });
    });

    describe('createSubscription', function() {
        it('should reject when no arguments are passed', function() {
            subscriptionNonce.createSubscription(()=>{}).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            })
            .then((err) => {
                should(err).be.ok;
            });
        });


        it('should reject when no address is passed', function() {
            subscriptionNonce.createSubscription(()=>{}, {}).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            })
            .then((err) => {
                should(err).be.ok;
            });
        });

        it('should reject when an invalid address is passed', function() {
            subscriptionNonce.createSubscription(
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
