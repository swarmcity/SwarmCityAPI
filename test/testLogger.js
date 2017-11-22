'use strict';
require('dotenv').config({
	path: '../.env',
});

const logger = require('../logs')('testLogger');

const scheduledTask = require('../scheduler/scheduledTask')();

describe('test of logging capabilities', function() {
	it('should receive all related events right after socket connects', function(done) {

		console.log(logger.info('a string'));
		logger.info('a string and an object', {
			a: 1,
			b: 2
		});
		logger.info('a string and an array', [1, 2, 3, 4, 5]);
		logger.info('a string and an array of objects', [{
			a: 1,
			b: 2
		}, {
			a: 3,
			b: 4
		}]);
		logger.error('a error string');
		logger.error('a error string with an object', {
			a: 1,
			b: 2
		});
		logger.error(new Error('an error'));
		done();



	});

});
