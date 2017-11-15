let s = require('./socket');


const scheduledTask = require('./scheduler/scheduledtask')();

s.listen();

scheduledTask.status();
