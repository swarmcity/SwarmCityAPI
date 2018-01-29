'use strict';

const logger = require('../src/logs')(module);

const should = require('should');

const IpfsCatFunction = require('../src/functions/ipfsCat').IpfsCatFunction;

describe('IpfsCatFunction', function() {
    it('should have a name and parameters', function() {
        let fut = new IpfsCatFunction();
        should(fut.name()).be.equal('ipfscat');
        should(fut.parameters()).be.Array;
    });

    it('should validate that the correct parameters are present', function() {
        let fut = new IpfsCatFunction();
        let errors = fut.validateData({});
        should(errors.length).be.greaterThan(0);
    });
});
