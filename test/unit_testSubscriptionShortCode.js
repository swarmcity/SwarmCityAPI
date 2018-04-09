'use strict';

const should = require('should');

const subscriptionBalance = require('../src/subscriptions/subscriptionShortCode')();

describe('subscription', function() {
    describe('name', function() {
        it('should have a name', function() {
            should(subscriptionBalance.name).be.equal('createShortCode');
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
                should(err).be.ok();
            });
        });

        it('should reject when no publicKey is passed', function() {
            subscriptionBalance.createSubscription(
                ()=>{}, {'username': 'me', 'avatar': 'BASE64'}
            ).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            })
            .then((err) => {
                should(err).be.ok();
            });
        });

        it('should reject when an invalid publicKey is passed', function() {
            subscriptionBalance.createSubscription(
                ()=>{}, {'publicKey': 'cofefe'}
            ).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            })
            .then((err) => {
                should(err).be.ok();
            });
        });

        it('should reject when no username is passed', function() {
            subscriptionBalance.createSubscription(
                ()=>{}, {'publicKey': process.env.SWTBALANCE, 'avatar': 'BASE64'}
            ).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            })
            .then((err) => {
                should(err).be.ok();
            });
        });

        it('should reject when no avatar is passed', function() {
            subscriptionBalance.createSubscription(
                ()=>{}, {'publicKey': process.env.SWTBALANCE, 'username': 'me'}
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
