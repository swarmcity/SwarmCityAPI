'use strict';

const logger = require('../logs')('jobs');

let jobPromises = [
	require('./hashtagsIndexer')().start(),
];

module.exports = function() {
	return ({
		startAll: function() {
			return new Promise((resolve, reject) => {
				Promise.all(jobPromises).then(() => {
						logger.info('All tasks started up');
						return resolve();
					})
					.catch((err) => {
						logger.error('Tasks startup failed');
						logger.error('Error:', new Error(err));
						reject();
					});
			});
		},
	});
};
