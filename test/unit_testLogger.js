'use strict';
require('dotenv').config({
	path: '../.env',
});

const logger = require('../src/logs')('testLogger');

describe('test of logging capabilities', function() {
	it('should receive all related events right after socket connects', function(done) {
		logger.info('a string');
		logger.info('a string and an object', {
			a: 1,
			b: 2,
		});
		logger.info('a string and an array', [1, 2, 3, 4, 5]);
		logger.info('a string and an array of objects', [{
			a: 1,
			b: 2,
		}, {
			a: 3,
			b: 4,
		}]);
		logger.error(new Error('an error'));
		logger.error({
			a: 'an error in another object',
			error: new Error('an error'),
		});
		done();
	});
});
