'use strict';

const logger = require('../src/logs')(module);

const should = require('should');
const sinon = require('sinon');

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

    it('should create a task and add it to the queue', function() {
        let scheduledTask = {'addTask': function() {}}
        let spy = sinon.stub(scheduledTask, 'addTask');
        let cb = sinon.spy();
        let fut = new IpfsCatFunction(scheduledTask);
        fut.execute(
            {},
            {'hash': 'QmXxr6WpiGhDD83P5DdjyEXAxbxmNZg6CZ3Gsh3ARuAvc2'},
            cb
        );
        logger.info(spy.calledOnce);
        should(spy.calledOnce).be.ok();
        logger.info(cb.called);
        should(cb.called).not.be.ok();
    });
});
