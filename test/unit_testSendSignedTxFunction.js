'use strict';

const should = require('should');
const sinon = require('sinon');

const SendSignedTransactionFunction = require('../src/functions/sendSignedTxFunction');

describe('SendSignedTransactionFunction', function() {
    it('should have a name and parameters', function() {
        let fut = new SendSignedTransactionFunction();
        should(fut.name()).be.equal('sendSignedTx');
        should(fut.parameters()).be.Array;
    });

    it('should validate that the correct parameters are present', function() {
        let fut = new SendSignedTransactionFunction();
        let errors = fut.validateData({});
        should(errors.length).be.equal(1);
    });

    it('should create a task and add it to the queue', function() {
        let scheduledTask = {'addTask': function() { }};
        let spy = sinon.stub(scheduledTask, 'addTask');
        let cb = sinon.spy();
        let fut = new SendSignedTransactionFunction(scheduledTask);
        fut.execute(
            {},
            { 'tx': '0xf889808609184e72a00082271094000000000000000000000000000000000000000080a47f74657374320000000000000000000000000000000000000000000000000000006000571ca08a8bbf888cfa37bbf0bb965423625641fc956967b81d12e23709cead01446075a01ce999b56a8a88504be365442ea61239198e23d1fce7d00fcfc5cd3b44b7215f' }, // eslint-disable-line
            cb
        );
        should(spy.calledOnce).be.ok();
        should(cb.called).not.be.ok();
    });

    it('should be able to handle unsuccesful tasks', function() {
        let fut = new SendSignedTransactionFunction();
        let cbSpy = sinon.spy();
        let data = {};
        let rh = fut.responseHandler(data, cbSpy);
        rh(data, {'succes': false, 'error': 'Sorry. No can do.'});
        should(cbSpy.calledOnce).be.ok();
        should(cbSpy.calledWith(
            {
                'response': 500,
                'data': 'Sorry. No can do.',
            }
        )).be.ok();
    });
});
