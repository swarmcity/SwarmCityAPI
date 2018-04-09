'use strict';

const should = require('should');
const sinon = require('sinon');

const IpfsAddFunction = require('../src/functions/IpfsAddFunction');

describe('IpfsAddFunction', function() {
    it('should have a name and parameters', function() {
        let fut = new IpfsAddFunction();
        should(fut.name()).be.equal('ipfsAdd');
        should(fut.parameters()).be.Array;
    });

    it('should validate that the correct parameters are present', function() {
        let fut = new IpfsAddFunction();
        let errors = fut.validateData({});
        should(errors.length).be.greaterThan(0);
    });

    it('should create a task and add it to the queue', function() {
        let scheduledTask = {'addTask': function() {}};
        let spy = sinon.stub(scheduledTask, 'addTask');
        let cb = sinon.spy();
        let fut = new IpfsAddFunction(scheduledTask);
        fut.execute(
            {},
            {'payload': 'dGVzdGluZyBhZGQ='},
            cb
        );
        should(spy.calledOnce).be.ok();
        should(cb.called).not.be.ok();
    });

    it('should be able to handle unsuccesful tasks', function() {
        let fut = new IpfsAddFunction();
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
});
