'use strict';

const should = require('should');

const parseReplyRequest = require('../src/functions/utils/parseSelectProvider');

describe('Function Util parseSelectProvider', function() {
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
        }).should.throw('Cannot create a selectee without a valid itemHash.');
    });

    it('should throw when an invalid hashtagAddress is passed', function() {
        (function() {
            parseReplyRequest(JSON.stringify({
                'itemHash': 'hash',
                'hashtagAddress': 'cofefe',
            }));
        }).should.throw('Cannot create a selectee without a valid hashtagAddress.');
    });

    it('should throw when no valid replier is passed', function() {
        (function() {
            parseReplyRequest(JSON.stringify({
                'itemHash': '0x06d0540d044ea8d6efd0a994c5235aebaa414607c632f6f0f1b5d6ea658a829a',
                'hashtagAddress': '0xeba08e7a1d8145b25c78b473fbc35aa24973d908',
                'selectee': 'not an object',
            }));
        }).should.throw('Cannot create a selectee without a valid selectee.');
    });

    it('should throw when no valid selectee address is passed', function() {
        const demoArgsInvalid = Object.assign({}, demoArgs);
        demoArgsInvalid.selectee.address = 'invalid address';
        (function() {
            parseReplyRequest(JSON.stringify(demoArgs));
        }).should.throw('Cannot create a selectee without a valid selectee address.');
    });

    it('should throw when no valid description is passed', function() {
        (function() {
            parseReplyRequest(JSON.stringify({
                'itemHash': '0x06d0540d044ea8d6efd0a994c5235aebaa414607c632f6f0f1b5d6ea658a829a',
                'hashtagAddress': '0xeba08e7a1d8145b25c78b473fbc35aa24973d908',
                'selectee': {
                    'secret': '<String>', // the ID of the item (not the hash)...
                    'address': '0xeba08e7a1d8145b25c78b473fbc35aa24973d908', // the ETH address
                },
                'reply': 'not an object',
            }));
        }).should.throw('Cannot create a selectee without a valid reply.');
    });
});
