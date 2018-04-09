'use strict';

const should = require('should');
const sinon = require('sinon');

const ReadShortCodeFunction = require('../src/functions/ReadShortCodeFunction');

describe('ReadShortCodeFunction', function() {
    it('should have a name and parameters', function() {
        let fut = new ReadShortCodeFunction();
        should(fut.name()).be.equal('readShortCode');
        should(fut.parameters()).be.Array;
    });

    it('should validate that the correct parameters are present', function() {
        let fut = new ReadShortCodeFunction();
        let errors = fut.validateData({});
        should(errors.length).be.greaterThan(0);
    });

    it('should create a task and add it to the queue', function() {
        let scheduledTask = {'addTask': function() {}};
        let spy = sinon.stub(scheduledTask, 'addTask');
        let cb = sinon.spy();
        let fut = new ReadShortCodeFunction(scheduledTask);
        fut.execute(
            {},
            {'shortCode': '12345'},
            cb
        );
        should(spy.calledOnce).be.ok();
        should(cb.called).not.be.ok();
    });

    it('should be able to handle unsuccesful tasks', function() {
        let fut = new ReadShortCodeFunction();
        let cbSpy = sinon.spy();
        let data = {'shortCode': 665};
        let rh = fut.responseHandler(data, cbSpy);
        rh(data, {'success': false, 'error': 'Sorry. No can do.'});
        should(cbSpy.calledOnce).be.ok();
        should(cbSpy.calledWith(
            {
                'response': 400,
                'error': 'ShortCode 665 not found.',
            }
        )).be.ok();
    });

    it('should be able to handle succesful tasks', function() {
        let fut = new ReadShortCodeFunction();
        let cbSpy = sinon.spy();
        let data = {'shortCode': '12345'};
        let rh = fut.responseHandler(data, cbSpy);
        let taskResult = {
            'publicKey': process.env.SWTBALANCE,
            'username': 'me',
            'avatar': 'BASE64',
        };
        rh(taskResult, {'success': true});
        should(cbSpy.calledOnce).be.ok();
        should(cbSpy.calledWith(
            {
                'response': 200,
                'data': {
                    'publicKey': taskResult.publicKey,
                    'username': taskResult.username,
                    'avatar': taskResult.avatar,
                },
            }
        )).be.ok();
    });

    it('should call the dbService to get the ShortCode data', function() {
        let scheduledTask = {'addTask': () => {}};
        let schedulerSpy = sinon.stub(scheduledTask, 'addTask');
        let dbService = {'readShortCode': () => {}};
        let dbServiceSpy = sinon.stub(dbService, 'readShortCode').returns(
            Promise.resolve({
                'publicKey': process.env.SWTBALANCE,
                'username': 'me',
                'avatar': 'BASE64',
            })
        );
        let fut = new ReadShortCodeFunction(scheduledTask, dbService);
        let data = {'shortCode': '12345'};
        let t = fut.func(data);
        t({'func': t});
        should(schedulerSpy.called).not.be.ok();
        should(dbServiceSpy.calledOnce).be.ok();
        should(dbServiceSpy.calledWith('12345')).be.ok();
    });
});
