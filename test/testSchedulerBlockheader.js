'use strict';
const logger = require('../src/logs')(module);

const blockHeaderTask = require('../src/scheduler/blockHeaderTask')();

describe('Swarm City scheduler', function() {
	it('should add & unroll blockHeaderTask task', function(done) {
		blockHeaderTask.addTask({
			name: 'print blockheader',
			func: (task) => {
				return new Promise((resolve, reject) => {
					logger.info('Hello %j', task.data);
					task.data.toPrint = (task.data.toPrint || '') + '+';
					resolve(task.data);
				});
			},
			responsehandler: (res, task) => {
				return new Promise((resolve, reject) => {
					logger.info('Hello Finished... RES=%j task=%j', res, task);
					resolve();
					done();
				});
			},
			data: {
                toPrint: 'a',
            },
		});
	});
});
