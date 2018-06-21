'use strict';

const should = require('should');

const subscriptionHashtagItem = require('../src/subscriptions/subscriptionHashtagItem')();

describe('subscriptionHashtagItem', function() {
    describe('name', function() {
        it('should have a name', function() {
            should(subscriptionHashtagItem.name).be.equal('hashtagItem');
        });
    });

    describe('createSubscription', function() {
        it('should reject when no arguments are passed', function() {
            subscriptionHashtagItem.createSubscription(()=>{}).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            })
            .then((err) => {
                should(err).be.ok();
            });
        });


        it('should reject when no address is passed', function() {
            subscriptionHashtagItem.createSubscription(()=>{}, {}).then((res) => {
                Promise.reject('Expected rejection');
            }).catch((err) => {
                return Promise.resolve(err);
            })
            .then((err) => {
                should(err).be.ok();
            });
        });

        it('should reject when an invalid address is passed', function() {
            subscriptionHashtagItem.createSubscription(
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
