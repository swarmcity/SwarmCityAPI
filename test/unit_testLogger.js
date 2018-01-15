'use strict';
require('dotenv').config({
	path: '../.env',
});


describe('test of logging capabilities', function() {
	it('should log stuff however it want it to', function(done) {
        let logger = require('../src/logs')(module);

		logger.debug('a string');
		logger.debug('a string and an object %j', {
			a: 1,
			b: 2,
		});
		logger.debug('a string and an array %j', [1, 2, 3, 4, 5]);
		logger.debug('a string and an array of objects %j', [{
			a: 1,
			b: 2,
		}, {
			a: 3,
			b: 4,
		}]);
		logger.debug('%j', new Error('an error'));
		logger.debug('%j', {
			a: 'an error in another object',
			error: new Error('an error'),
		});
		done();
	});

    it('should also log if I did not specify a module', function(done) {
        let logger = require('../src/logs')();
        logger.debug('A message');
        done();
    });

    it('should also log if I specified a string', function(done) {
        let logger = require('../src/logs')('logTest');
        logger.debug('A message');
        done();
    });
});
