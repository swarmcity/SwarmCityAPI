'use strict';
const scheduledTask = require('../scheduler/scheduledTask')();
const logger = require('../logs')('sendShhMessage');
const web3 = require('../globalWeb3').web3;
const shhHelpers = require('../globalWeb3').shhHelpers;

/**
 * returns name (verb) of this function
 * @return     {null}   none
 */
function name() {
	return 'sendShhMessage';
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
		name: 'sendShhMessage',
		func: (task) => {
			logger.info('sendShhMessage start', data);
			return new Promise((resolve, reject) => {
				let identities = [];

				// Promise.all([
				// 	web3.shh.newSymKey().then((id) => {
				// 		identities.push(id);
				// 	}),
				// 	web3.shh.newKeyPair().then((id) => {
				// 		identities.push(id);
				// 	})

				// ]).then(() => {

				// 	// will receive also its own message send, below
				// 	// subscription = web3.shh.subscribe("messages", {
				// 	// 	symKeyID: identities[0],
				// 	// 	topics: [shhHelpers.shhHash(data.shortcode)],
				// 	// }).on('data', console.log);

				// }).then(() => {

				web3.shh.generateSymKeyFromPassword(data.shortcode).then((symKeyID) => {
					const opts = {
						symKeyID: symKeyID, // identities[0], // encrypts using the sym key ID
						//sig: identities[1], // signs the message using the keyPair ID
						ttl: 10,
						topic: shhHelpers.shhHash(data.shortcode),

						payload: web3.utils.asciiToHex(JSON.stringify(data.payload)),
						powTime: 10,
						powTarget: 0.3
					};
					logger.info('shh opts', opts, data);
					web3.shh.post(opts);
				});

				// }).catch((e) => {
				// 	logger.error('HODL', e);
				// });


				// try {
				// 	resolve();
				// } catch (error) {
				// 	logger.error(error);
				// 	reject(error);
				// }
			});
		},
		responsehandler: (res, task) => {
			if (task.success) {
				let reply = {
					response: 200,
					result: res,
				};
				return callback(reply);
			} else {
				let reply = {
					response: 500,
					result: res,
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
	createTask: createTask,
};
