'use strict';

const should = require('should');
const sinon = require('sinon');

const SendRawTxFunction = require('../src/functions/SendRawTxFunction');

describe('SendRawTxFunction', function() {
    it('should have a name and parameters', function() {
        let fut = new SendRawTxFunction();
        should(fut.name()).be.equal('sendRawTx');
        should(fut.parameters()).be.Array;
    });

    it('should validate that the correct parameters are present', function() {
        let fut = new SendRawTxFunction();
        let errors = fut.validateData({});
        should(errors.length).be.greaterThan(0);
    });

    it('should create a task and add it to the queue', function() {
        let scheduledTask = {'addTask': function() {}};
        let spy = sinon.stub(scheduledTask, 'addTask');
        let cb = sinon.spy();
        let fut = new SendRawTxFunction(scheduledTask);
        fut.execute(
            {},
            {'tx': '0xf889808609184e72a00082271094000000000000000000000000000000000000000080a47f74657374320000000000000000000000000000000000000000000000000000006000571ca08a8bbf888cfa37bbf0bb965423625641fc956967b81d12e23709cead01446075a01ce999b56a8a88504be365442ea61239198e23d1fce7d00fcfc5cd3b44b7215f'}, // eslint-disable-line
            cb
        );
        should(spy.calledOnce).be.ok();
        should(cb.called).not.be.ok();
    });

    it('should be able to handle unsuccesful tasks', function() {
        let fut = new SendRawTxFunction();
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

    it('should reject the func without a tx hash', function() {
        let scheduledTask = {'addTask': () => {}};
        let schedulerSpy = sinon.stub(scheduledTask, 'addTask');
        let web3 = {};
        let fut = new SendRawTxFunction(scheduledTask, web3);
        let t = fut.func({});
        t({'func': t})
            .catch((e) => {
                return Promise.resolve(e);
            })
            .then((err) => {
                should(err).be.ok();
            });
        should(schedulerSpy.called).not.be.ok();
    });

});
