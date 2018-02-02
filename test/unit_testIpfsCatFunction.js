'use strict';

const should = require('should');
const sinon = require('sinon');

const IpfsCatFunction = require('../src/functions/IpfsCatFunction');

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
        let scheduledTask = {'addTask': function() {}};
        let spy = sinon.stub(scheduledTask, 'addTask');
        let cb = sinon.spy();
        let fut = new IpfsCatFunction(scheduledTask);
        fut.execute(
            {},
            {'hash': 'QmXxr6WpiGhDD83P5DdjyEXAxbxmNZg6CZ3Gsh3ARuAvc2'},
            cb
        );
        should(spy.calledOnce).be.ok();
        should(cb.called).not.be.ok();
    });

    it('should be able to handle unsuccesful tasks', function() {
        let fut = new IpfsCatFunction();
        let cbSpy = sinon.spy();
        let data = {};
        let rh = fut.responseHandler(data, cbSpy);
        rh(data, {'succes': false, 'error': 'Sorry. No can do.'});
        should(cbSpy.calledOnce).be.ok();
        should(cbSpy.calledWith(
            {
                'response': 500,
                'data': data,
                'error': 'Sorry. No can do.',
            }
        )).be.ok();
    });

    it('should call ipfsService to get a file', function() {
        let scheduledTask = {'addTask': () => {}};
        let schedulerSpy = sinon.stub(scheduledTask, 'addTask');
        let ipfsService = {'cat': () => {}};
        let spy = sinon.stub(ipfsService, 'cat').returns(
            Promise.resolve('Hello world!')
        );
        let fut = new IpfsCatFunction(scheduledTask, ipfsService);
        let t = fut.func(
            {'hash': 'QmXxr6WpiGhDD83P5DdjyEXAxbxmNZg6CZ3Gsh3ARuAvc2'}
        );
        t({'func': t});
        should(schedulerSpy.called).not.be.ok();
        should(spy.calledOnce).be.ok();
        should(spy.calledWith('QmXxr6WpiGhDD83P5DdjyEXAxbxmNZg6CZ3Gsh3ARuAvc2')).be.ok();
    });
});
