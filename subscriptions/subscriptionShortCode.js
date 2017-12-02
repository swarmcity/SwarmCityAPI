/**
 * Subscription manager for 'Nonce'
 */
'use strict';
const logger = require('../logs.js')();
const jsonHash = require('json-hash');
const scheduledTask = require('../scheduler/scheduledTask')();
const db = require('../globalDB').db;

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

const stdValidity = 30 * 1000;

/**
 * Creates an unique short code.
 *
 * @param      {Number}   decimals  decimals of the shortcode
 * @return     {Promise}  resolves with new value.
 */
function createUniqueShortCode(decimals) {
	return new Promise((resolve, reject) => {
		let newShortcode = createShortCode(decimals);

		let key = 'shortcode-' + newShortcode;
		db.get(key).then((val) => {
			// so we have data..
			try {
				let data = JSON.parse(val);
				// is the code still valid ? If it has expired, reuse this code.
				if (data.validUntil && data.validUntil < (new Date).getTime()) {
					return resolve(newShortcode);
				}
			} catch (e) {
				// can't read the data - reuse this code.
				return resolve(newShortcode);
			}
			// code already exists & not expired yet - try again.
			return createUniqueShortCode(decimals);
		}).catch((err) => {
			if (err.notFound) {
				logger.error('key', key, 'not found (yet) in DB. ');
				return resolve(newShortcode);
			}
			reject(new Error(err));
		});
	});
}

/**
 * saves shortcode payload in DB
 *
 * @param      {string}   shortcode  The shortcode
 * @param      {Number}   validity   The validity of this data in ms
 * @param      {Object}   payload    The payload to store
 * @return     {Promise}  resolves when ready..
 */
function saveDataToShortCode(shortcode, validity, payload) {
	return new Promise((resolve, reject) => {
		let key = 'shortcode-' + shortcode;
		let val = {
			shortcode: shortcode,
			validUntil: (new Date).getTime() + validity,
			payload: payload,
		};
		logger.info('Storing key/val', key, val);
		db.put(key, JSON.stringify(val), function(err) {
			if (err) {
				logger.error(err);
				return reject(err);
			}
			resolve();
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
	let validity = args.validity || stdValidity;

	// create task
	let _task = {
		name: 'createShortCode',
		func: (task) => {
			return new Promise((resolve, reject) => {
				createUniqueShortCode(5).then((shortcode) => {
					saveDataToShortCode(shortcode, validity, args.payload).then(() => {
						resolve({
							shortcode: shortcode,
							validity: validity,
						});
					}).catch(reject);
				}).catch(reject);
			});
		},
		responsehandler: (res, task) => {
			let replyHash = jsonHash.digest(res);
			if (task.data.lastReplyHash !== replyHash) {
				logger.debug('received RES=', JSON.stringify(res, null, 4));
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
		name: 'shortcode',
		createSubscription: createSubscription,
	});
};
