'use strict';

const logger = require('../logs')('jobs');

let jobPromises = [
//	require('./hashtagsIndexer')().start(),
	require('./hashtagsIndexer')().reset(),
];

module.exports = function() {
	return ({
		startAll: function() {
			return (
				Promise.all(jobPromises).then(() => {
					logger.info('All tasks started up');
				})
				.catch((err) => {
					logger.error('Tasks startup failed');
					logger.error(new Error(err));
				})
			);
		}
	});
}
