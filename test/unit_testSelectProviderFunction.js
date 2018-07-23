'use strict';

const should = require('should');
const sinon = require('sinon');

const SelectProviderFunction = require('../src/functions/SelectProviderFunction');

describe('SelectProviderFunction', function() {
    const demoArgs = {
        'itemHash': '0x06d0540d044ea8d6efd0a994c5235aebaa414607c632f6f0f1b5d6ea658a829a',
        'hashtagAddress': '0xeba08e7a1d8145b25c78b473fbc35aa24973d908',
        'selectee': {
            'secret': '<String>', // the ID of the item (not the hash)...
            'address': '0xeba08e7a1d8145b25c78b473fbc35aa24973d908', // the ETH address
        },
        'reply': {
            'dateTime': 12345,
            'username': 'Tester Y',
            'avatarHash': '<base64>',
            'publicKey': 'abc1234...', // the full Ethereum public key
            'address': '0x123...abc', // the ETH address
            'reputation': '<String>', // the ProviderRep balance on this hashtag
            'description': '<String>', // the reply msg
        },
    };

    it('should have a name and parameters', function() {
        let selectProviderFunction = new SelectProviderFunction();
        should(selectProviderFunction.name()).be.equal('selectProvider');
        should(selectProviderFunction.parameters()).be.Array;
    });

    it('should validate that the correct parameters are present', function() {
        let selectProviderFunction = new SelectProviderFunction();
        let errors = selectProviderFunction.validateData({});
        should(errors.length).be.greaterThan(0);
    });

    it('should not throw when correct parameters are passed', function() {
        let selectProviderFunction = new SelectProviderFunction();
        let errors = selectProviderFunction.validateData(demoArgs);
        should(errors.length).equal(0);
    });

    it('should create a task and add it to the queue', function() {
        let scheduledTask = {'addTask': function() {}};
        let spy = sinon.stub(scheduledTask, 'addTask');
        let cb = sinon.spy();
        let selectProviderFunction = new SelectProviderFunction(scheduledTask);
        selectProviderFunction.execute(
            {},
            {'selectee': demoArgs},
            cb
        );
        should(spy.calledOnce).be.ok();
        should(cb.called).not.be.ok();
    });

    it('should be able to handle unsuccesful tasks', function() {
        let selectProviderFunction = new SelectProviderFunction();
        let cbSpy = sinon.spy();
        let data = {'shortCode': 665};
        let responseHandler = selectProviderFunction.responseHandler(data, cbSpy);
        responseHandler(data, {'success': false, 'error': 'Error message'});
        should(cbSpy.calledOnce).be.ok();
        should(cbSpy.lastCall.lastArg).deepEqual(
            {
                'response': 400,
                'error': 'Failed to add selectee: Error message',
            }
        );
    });

    it('should be able to handle succesful tasks', function() {
        let selectProviderFunction = new SelectProviderFunction();
        let cbSpy = sinon.spy();
        let data = {'shortCode': '12345'};
        let responseHandler = selectProviderFunction.responseHandler(data, cbSpy);
        let taskResult = {
            'address': process.env.SWTBALANCE,
            'userName': 'me',
            'avatar': 'BASE64',
        };
        responseHandler(taskResult, {'success': true});
        should(cbSpy.calledOnce).be.ok();
        should(cbSpy.calledWith(
            {
                'response': 200,
                'data': {
                    'address': taskResult.address,
                    'userName': taskResult.userName,
                    'avatar': taskResult.avatar,
                },
            }
        )).be.ok();
    });

    it('should call the dbService to addSelecteeToHashtagItem', async () => {
        let scheduledTask = {'addTask': () => {}};
        let schedulerSpy = sinon.stub(scheduledTask, 'addTask');
        let dbService = {'addSelecteeToHashtagItem': () => {}};
        let fakeResponse = 'hashtagItem';
        let dbServiceSpy = sinon.stub(dbService, 'addSelecteeToHashtagItem').returns(
            Promise.resolve(fakeResponse)
        );
        let fetchProviderReputation = async () => {};
        let selectProviderFunction = new SelectProviderFunction(
            scheduledTask,
            dbService,
            fetchProviderReputation
        );
        let data = {selectee: JSON.stringify(demoArgs)};
        const res = await selectProviderFunction.func(data)();
        should(res).equal(fakeResponse);
        should(schedulerSpy.called).not.be.ok();
        should(dbServiceSpy.calledOnce).be.ok();
    });
});
