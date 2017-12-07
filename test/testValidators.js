'use strict';

const should = require('should');
const validators = require('../validators');

describe('Validators', function() {
    describe('isAddress()', function() {
        it('should return False when there is no address', function() {
            validators.isAddress().should.be.equal(false);
        });
        it('should return False when address is not a string', function() {
            validators.isAddress(666).should.be.equal(false);
        });
        it('should return False when address contains less than 40 characters', function() {
            validators.isAddress('0x123456789').should.be.equal(false);
        });
        it('should return False when address contains more than 40 characters', function() {
            validators.isAddress('0x123456789012345678901234567890123456789012345').should.be.equal(false);
        });
        it('should return True when address is valid lowercase', function() {
            validators.isAddress('0xabcde67890abcde67890abcde67890abcde67890').should.be.equal(true);
        });
        it('should return True when address is valid and contains uppercase', function() {
            validators.isAddress('0xabcde67890abcde67890abcde67890ABCDE67890').should.be.equal(true);
        });
        it('should return True when address does not start with 0x', function() {
            validators.isAddress('abcde67890abcde67890abcde67890ABCDE67890').should.be.equal(true);
        });
    });
});
