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
