'use strict';
const logger = require('../logs')();

const blockHeaderTask = require('../scheduler/blockHeaderTask')();

describe('Swarm City scheduler', function() {
	it('should add & unroll blockHeaderTask task', function(done) {
		blockHeaderTask.addTask({
			func: (task) => {
				return new Promise((resolve, reject) => {
					logger.info('Hello', task.data);
					task.data = task.data + '+';
					resolve(task.data);
				});
			},
			responsehandler: (res, task) => {
				return new Promise((resolve, reject) => {
					logger.info('Hello Finished... RES=', res, 'task=', task);
					resolve();
					done();
				});
			},
			data: 'a',
		});
	});
});
