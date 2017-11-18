let s = require('./socket');


const scheduledTask = require('./scheduler/scheduledtask')();
const jobs = require('./jobs')();

jobs.startAll().then(() => {
	s.listen();
	scheduledTask.status();
}).catch((e) => {
	logger.error(new Error(e));
});
