// #### Temporal fix, fallback value for HASHTAG_CONTRACT
process.env.HASHTAG_CONTRACT =
	process.env.HASHTAG_CONTRACT
	|| '0xC5E5AF4592Cfd750B96cFfe8c3C848ce258C72ac';

// Show the current environment
const showEnv = require('./showEnv');
showEnv.showEnv();

let s = require('./socket');
let http = require('./http');

const scheduledTask = require('./scheduler/scheduledTask')();
const jobs = require('./jobs')();
const logger = require('./logs')(module);

logger.info('Starting up jobs..');

jobs.startAll().then(() => {
	logger.info('All jobs started up. Start listening');
	s.listen();
	http.listen();
	scheduledTask.status();
}).catch((e) => {
	logger.error(new Error(e));
});
