/**
 * Subscription manager for 'Nonce'
 */
'use strict';
const logger = require('../logs.js')(module);
const validate = require('../validators');
const jsonHash = require('json-hash');
const scheduledTask = require('../scheduler/scheduledTask')();

const dbService = require('../services').dbService;

/**
 * clean up a task from the scheduler when socket wants to unsubscribe
 *
 * @param      {Object}   task    The task
 * @return     {Promise}  result of removing the task (no return value)
 */
function cancelSubscription(task) {
	return Promise.resolve(
		scheduledTask.removeTask(task)
	);
}

/**
 * create random shortcode
 *
 * @param      {number}  decimals  The decimals
 * @return     {string}  a shortcode
 */
function createShortCode(decimals) {
	if (decimals < 2) {
		decimals = 2;
	}

	let chars = '0123456789';
	let randomstring = '';

	for (let i = 0; i < decimals; i++) {
		let rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum, rnum + 1);
	}
	return randomstring;
}

const stdValidity = 120 * 1000;

/**
 * Creates an unique short code.
 *
 * @param      {Number}   decimals  decimals of the shortcode
 * @return     {Promise}  resolves with new value.
 */
function createUniqueShortCode(decimals) {
	return new Promise((resolve, reject) => {
		let newShortcode = createShortCode(decimals);

        dbService
            .readShortCode(newShortcode)
            .then((val) => {
                // code already exists & not expired yet - try again.
                return createUniqueShortCode(decimals);
            }).catch((err) => {
				// can't read the data or
                // it does not exist or
                // the code is no longer valid
                // use the new code.
				resolve(newShortcode);
            });
	});
}

/**
 * Creates a subscription.
 *
 * @param      {Function} 	emitToSubscriber the function to call when you want to emit data
 * @param      {Object}  	args    The parameters sent with the subscription
 * @return     {Promise}  	resolves with the subscription object
 */
function createSubscription(emitToSubscriber, args) {
	let validity = stdValidity;

    let payload = {};

	if (!args || !args.publicKey || !validate.isAddress(args.publicKey)) {
		return Promise.reject(
            'Cannot create a ShortCode without a valid publicKey.'
        );
	}
    payload.publicKey = args.publicKey;
	if (!args || !args.username) {
		return Promise.reject(
            'Cannot create a ShortCode without a valid username.'
        );
	}
    payload.username = args.username;
	if (!args || !args.avatar) {
		return Promise.reject(
            'Cannot create a ShortCode without a valid avatar.'
        );
    }
    payload.avatar = args.avatar;

	logger.info('Creating a ShortCode for %s', args.publicKey);

	// create task
	let _task = {
		name: 'createShortCode',
		func: (task) => {
			return new Promise((resolve, reject) => {
				createUniqueShortCode(5).then((shortcode) => {
					dbService.saveDataToShortCode(shortcode, validity, payload).then(() => {
						resolve({
							shortCode: shortcode,
							validity: validity,
						});
					}).catch(reject);
				}).catch(reject);
			});
		},
		responsehandler: (res, task) => {
			let replyHash = jsonHash.digest(res);
			if (task.data.lastReplyHash !== replyHash) {
				logger.debug('received RES=%j', res);
				emitToSubscriber('shortcodeChanged', res);
				task.data.lastReplyHash = replyHash;
			}
			// re-schedule myself
			task.nextRun = (new Date).getTime() + validity;
			scheduledTask.addTask(task);
		},
		data: {},
	};

	scheduledTask.addTask(_task);
	// run it a first time return subscription
	return _task.func(_task).then((reply) => {
		return Promise.resolve({
			task: _task,
			initialResponse: reply,
			cancelSubscription: cancelSubscription,
		});
	});
}

module.exports = function() {
	return ({
		name: 'createShortCode',
		createSubscription: createSubscription,
	});
};
