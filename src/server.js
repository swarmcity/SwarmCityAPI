require('./showEnv');
let s = require('./socket');


const scheduledTask = require('./scheduler/scheduledTask')();
const jobs = require('./jobs')();
const logger = require('./logs')('server');

logger.info('Starting up jobs..');

jobs.startAll().then(() => {
	logger.info('All jobs started up. Start listening');
	s.listen();
	scheduledTask.status();
}).catch((e) => {
	logger.error(new Error(e));
});
