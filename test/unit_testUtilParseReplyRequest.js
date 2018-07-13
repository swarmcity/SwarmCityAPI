'use strict';

const should = require('should');

const parseReplyRequest = require('../src/functions/utils/parseReplyRequest');

describe('Function Util parseReplyRequest', function() {
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

    it('should not throw when correct arguments are passed', function() {
        const res = parseReplyRequest(JSON.stringify(demoArgs));
        should(res).deepEqual(demoArgs);
    });

    it('should throw when no arguments are passed', function() {
        (function() {
            parseReplyRequest();
        }).should.throw();
    });

    it('should throw when no itemHash is passed', function() {
        (function() {
            parseReplyRequest(JSON.stringify({
                'hashtagAddress': 'address',
            }));
        }).should.throw('Cannot create a replyRequest without a valid itemHash.');
    });

    it('should throw when an invalid hashtagAddress is passed', function() {
        (function() {
            parseReplyRequest(JSON.stringify({
                'itemHash': 'hash',
                'hashtagAddress': 'cofefe',
            }));
        }).should.throw('Cannot create a replyRequest without a valid hashtagAddress.');
    });

    it('should throw when no valid replier is passed', function() {
        (function() {
            parseReplyRequest(JSON.stringify({
                'itemHash': '0x06d0540d044ea8d6efd0a994c5235aebaa414607c632f6f0f1b5d6ea658a829a',
                'hashtagAddress': '0xeba08e7a1d8145b25c78b473fbc35aa24973d908',
                'replier': 'not an object',
            }));
        }).should.throw('Cannot create a replyRequest without a valid replier.');
    });

    it('should throw when no valid replier address is passed', function() {
        const demoArgsInvalid = Object.assign({}, demoArgs);
        demoArgsInvalid.replier.address = 'invalid address';
        (function() {
            parseReplyRequest(JSON.stringify(demoArgs));
        }).should.throw('Cannot create a replyRequest without a valid replier/provider address.');
    });

    it('should throw when no valid description is passed', function() {
        (function() {
            parseReplyRequest(JSON.stringify({
                'itemHash': '0x06d0540d044ea8d6efd0a994c5235aebaa414607c632f6f0f1b5d6ea658a829a',
                'hashtagAddress': '0xeba08e7a1d8145b25c78b473fbc35aa24973d908',
                'replier': {
                    'username': 'Harry Humble',
                    'avatarHash': 'QmQTTfDbE5wM1dvucWpaEmERXC75RUDhppoZLcBjNWLQ6D',
                    'address': '0x369d787f3ecf4a0e57cdfcfb2db92134e1982e09',
                    'publicKey': 'full public key',
                },
                'decription': 'wrong spelling',
            }));
        }).should.throw('Cannot create a replyRequest without a valid description.');
    });
});
