'use strict';

const should = require('should');

const getBalance = require('../src/tasks/getBalance')();

describe('getBalanceTask', function() {
	it('should reject when no data is passed', function() {
        getBalance.getBalance().then((res) => {
            Promise.reject('Expected rejection');
        }).catch((err) => {
            return Promise.resolve(err);
        })
        .then((err) => {
            should(err).be.ok;
        });
    });


	it('should reject when no address is passed', function() {
        getBalance.getBalance({}).then((res) => {
            Promise.reject('Expected rejection');
        }).catch((err) => {
            return Promise.resolve(err);
        })
        .then((err) => {
            should(err).be.ok;
        });
    });

	it('should reject when an invalid address is passed', function() {
        getBalance.getBalance({'address': 'cofefe'}).then((res) => {
            Promise.reject('Expected rejection');
        }).catch((err) => {
            return Promise.resolve(err);
        })
        .then((err) => {
            should(err).be.ok;
        });
    });
});
