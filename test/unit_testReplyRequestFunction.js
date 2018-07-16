'use strict';

const should = require('should');
const sinon = require('sinon');

const ReplyRequestFunction = require('../src/functions/ReplyRequestFunction');

describe('ReplyRequestFunction', function() {
    const demoArgs = {
        'itemHash': '0x06d0540d044ea8d6efd0a994c5235aebaa414607c632f6f0f1b5d6ea658a829a',
        'hashtagAddress': '0xeba08e7a1d8145b25c78b473fbc35aa24973d908',
        'replier': {
            'username': 'Harry Humble',
            'avatarHash': 'QmQTTfDbE5wM1dvucWpaEmERXC75RUDhppoZLcBjNWLQ6D',
            'address': '0x369d787f3ecf4a0e57cdfcfb2db92134e1982e09',
            'publicKey': 'full public key',
        },
        'description': 'I can help you with that',
    };

    it('should have a name and parameters', function() {
        let replyRequestFunction = new ReplyRequestFunction();
        should(replyRequestFunction.name()).be.equal('replyRequest');
        should(replyRequestFunction.parameters()).be.Array;
    });

    it('should validate that the correct parameters are present', function() {
        let replyRequestFunction = new ReplyRequestFunction();
        let errors = replyRequestFunction.validateData({});
        should(errors.length).be.greaterThan(0);
    });

    it('should not throw when correct parameters are passed', function() {
        let replyRequestFunction = new ReplyRequestFunction();
        let errors = replyRequestFunction.validateData({reply: 'reply'});
        should(errors.length).equal(0);
    });

    it('should construct the reply object correctly (concept)', () => {
        const reply = Object.assign({name: 'name'}, {
            reputation: 5, // '5'
        });
        should(reply).deepEqual({
            name: 'name',
            reputation: 5,
        });
    });

    it('should create a task and add it to the queue', function() {
        let scheduledTask = {'addTask': function() {}};
        let spy = sinon.stub(scheduledTask, 'addTask');
        let cb = sinon.spy();
        let replyRequestFunction = new ReplyRequestFunction(scheduledTask);
        replyRequestFunction.execute(
            {},
            {'reply': 'reply'},
            cb
        );
        should(spy.calledOnce).be.ok();
        should(cb.called).not.be.ok();
    });

    it('should be able to handle unsuccesful tasks', function() {
        let replyRequestFunction = new ReplyRequestFunction();
        let cbSpy = sinon.spy();
        let data = {'shortCode': 665};
        let responseHandler = replyRequestFunction.responseHandler(data, cbSpy);
        responseHandler(data, {'success': false, 'error': 'Error message'});
        should(cbSpy.calledOnce).be.ok();
        should(cbSpy.lastCall.lastArg).deepEqual(
            {
                'response': 400,
                'error': 'Failed to add reply: Error message',
            }
        );
    });

    it('should be able to handle succesful tasks', function() {
        let replyRequestFunction = new ReplyRequestFunction();
        let cbSpy = sinon.spy();
        let data = {'shortCode': '12345'};
        let responseHandler = replyRequestFunction.responseHandler(data, cbSpy);
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

    it('should call the dbService to addReplyToHashtagItem', async () => {
        let scheduledTask = {'addTask': () => {}};
        let schedulerSpy = sinon.stub(scheduledTask, 'addTask');
        let dbService = {'addReplyToHashtagItem': () => {}};
        let fakeResponse = 'hashtagItem';
        let dbServiceSpy = sinon.stub(dbService, 'addReplyToHashtagItem').returns(
            Promise.resolve(fakeResponse)
        );
        let fetchProviderReputation = async () => {};
        let replyRequestFunction = new ReplyRequestFunction(
            scheduledTask,
            dbService,
            fetchProviderReputation
        );
        let data = {reply: JSON.stringify(demoArgs)};
        const res = await replyRequestFunction.func(data)();
        should(res).equal(fakeResponse);
        should(schedulerSpy.called).not.be.ok();
        should(dbServiceSpy.calledOnce).be.ok();
    });
});
