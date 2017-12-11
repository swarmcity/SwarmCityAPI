'use strict';

const should = require('should');
const validators = require('../validators');

describe('Validators', function() {
    describe('isAddress()', function() {
        it('should return False when there is no address', function() {
            should(validators.isAddress()).not.be.ok;
        });
        it('should return False when address is not a string', function() {
            should(validators.isAddress(666)).not.be.ok;
        });
        it('should return False when address contains less than 40 characters', function() {
            should(validators.isAddress('0x123456789')).not.be.ok;
        });
        it('should return False when address contains more than 40 characters', function() {
            should(
                validators.isAddress('0x123456789012345678901234567890123456789012345')
            ).not.be.ok;
        });
        it('should return True when address is valid lowercase', function() {
            should(
                validators.isAddress('0xabcde67890abcde67890abcde67890abcde67890')
            ).be.ok;
        });
        it('should return True when address is valid and contains uppercase', function() {
            should(
                validators.isAddress('0xabcde67890abcde67890abcde67890ABCDE67890')
            ).be.ok;
        });
        it('should return True when address does not start with 0x', function() {
            should(
                validators.isAddress('abcde67890abcde67890abcde67890ABCDE67890')
            ).be.ok;
        });
    });
});
