'use strict';

require('../environment');
const logger = require('../logs')('hashtagIndexer');
const db = require('../globaldb').db;
const web3 = require('../globalWeb3').web3;
const scheduledTask = require('../scheduler/scheduledtask')();

module.exports = function() {
	let subscription;
	return ({
		start: function() {
			return new Promise((resolve, reject) => {

				scheduledTask.addTask({
					name: 'hashtagIndexerTask',
					func: (task) => {
						return new Promise((resolve, reject) => {

							subscription = web3.eth.subscribe('logs', {
									address: process.env.PARAMETERSCONTRACT,
									fromBlock: process.env.PARAMETERSCONTRACTSTARTBLOCK,
									//    topics: ['0x12345...']
								}, (error, result) => {
									logger.info(err, result);
								}).on("data", function(log) {
									logger.info('DATA', log);
								})
								.on("changed", function(log) {
									logger.info('DATA', log);
								});

						});
					},
					responsehandler: (res, task) => {
						
						//return blockHeaderTask.addTask(task);
						logger.info('subscription created',subscription);
						resolve();
					}
				});
			});
		},

		stop: function() {
			return new Promise((resolve, reject) => {
				subscription.unsubscribe(function(error, success) {
					if (success)
						console.log('Successfully unsubscribed!');
					resolve();
				});

			});
		},

	});
}
