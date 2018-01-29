'use strict';

const logs = require('../logs')(module);

const scheduledTask = require('../scheduler/scheduledTask')();

const ipfsService = require('../services').ipfsService;

/**
 * returns name (verb) of this function
 * @return     {null}   none
 */
function name() {
	return 'ipfscat';
}

function parameters() {
    return {
        'hash': 'IPFS hash of the file you want to see.,
    }
}

function execute(socket, data, callback) {
    let errors = validateData(data);
    if (errors.length) {
        let reply = {
            response: 400,
            data: data,
            errors: errors,
        };
        return callback(reply);
    }
    createTask(socket, data, callback);
}

function validateData(data) {
    let errors = [];
    parameters().forEach((p) => {
        if (!(p.name in data)) {
            errors.push(util.format('Parameter %s is missing.', p.name));
        }
    });
    return errors;
}

/**
 * create and execute the task
 *
 * @param      {Object}    socket    The socket
 * @param      {Object}    data      The data
 * @param      {Function}  callback  The callback
 */
function createTask(socket, data, callback) {
	scheduledTask.addTask({
		func: (task) => {
			logs.info('ipfscat start');
			return ipfsService.cat(data.hash);
		},
		responsehandler: (res, task) => {
			if (task.success && res) {
				// format the output if requested
				// else return the Buffer
				switch (data.format || 'buffer') {
					case 'base64':
					case 'ascii':
					case 'hex':
					case 'utf8':
						res = res.toString(data.format);
						break;
				}
				let reply = {
					response: 200,
					data: res,
				};
				return callback(reply);
			} else {
				let reply = {
					response: 500,
					data: res,
					error: task.error,
				};
				return callback(reply);
			}
		},
		data: {
			socket: socket,
		},
	});
}

module.exports = {
	name: name,
    parameters: parameters,
    execute: execute,
	createTask: createTask,
};
