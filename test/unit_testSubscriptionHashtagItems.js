'use strict';

const should = require('should');

const subscriptionHashtagItems = require('../src/subscriptions/subscriptionHashtagItems')();

describe('subscriptionHashtagItems', function() {
    describe('name', function() {
        it('should have a name', function() {
            should(subscriptionHashtagItems.name).be.equal('hashtagItems');
        });
    });

    describe('createSubscription', function() {
        it('should reject when no arguments are passed', function() {
            subscriptionHashtagItems.createSubscription(()=>{}).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            })
            .then((err) => {
                should(err).be.ok();
            });
        });


        it('should reject when no address is passed', function() {
            subscriptionHashtagItems.createSubscription(()=>{}, {}).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            })
            .then((err) => {
                should(err).be.ok();
            });
        });

        it('should reject when an invalid address is passed', function() {
            subscriptionHashtagItems.createSubscription(
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
