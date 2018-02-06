/**
 * subscriptions manager - keeps track of subscriptions per socket.
 */
'use strict';

const logger = require('../logs')(module);
const uuidv4 = require('uuid/v4');


// load the channel subscription handlers
const balance = require('./subscriptionBalance')();
const hashtags = require('./subscriptionHashtags')();
const hashtagItems = require('./subscriptionHashtagItems')();
const nonce = require('./subscriptionNonce')();
const shortcode = require('./subscriptionShortCode')();
const txhistory = require('./subscriptionTxHistory')();

// initialize available subscriptionchannels
let channels = {};
channels[balance.name] = balance;
channels[hashtags.name] = hashtags;
channels[hashtagItems.name] = hashtagItems;
channels[nonce.name] = nonce;
channels[shortcode.name] = shortcode;
channels[txhistory.name] = txhistory;

// all subscriptions are kept here
let subscriptions = {};

/**
 * manage removal of subscription
 *
 * @param      {String}  subscriptionId  The subscription identifier
 * @return     {Promise}  Promise resolving to true or false = success of removal
 */
function _removeSubscription(subscriptionId) {
	logger.debug('_removeSubscription ID %s', subscriptionId);
	if (subscriptions[subscriptionId]) {
		let _subscription = subscriptions[subscriptionId].subscription;
		_subscription.cancelSubscription(_subscription.task).then(() => {
			delete subscriptions[subscriptionId];
		}).catch((err) => {
			logger.error('Error canceling subscriptioni: %j', err);
		});
		return Promise.resolve(true);
	} else {
		return Promise.resolve(false);
	}
}

/**
 * print status of this module ( subscription list etc. ) to the logger
 *
 * @return     {Promise}  Resolves when done. No return value.
 */
function status() {
	let statusId = uuidv4();
	logger.info('---subscriptions status [%s]---', statusId);
	if (subscriptions === {}) {
		logger.info('No subscriptions');
	} else {
		logger.info('subscriptions:');
		let count = 1;
		for (let subscription in subscriptions) {
			if (Object.prototype.hasOwnProperty.call(subscriptions, subscription)) {
				logger.info(
                    '%i: %s -> channel %s (socket %s)',
                    count++,
                    subscription,
					subscriptions[subscription].channel,
					subscriptions[subscription].socket.id
                );
			}
		}
	}
	logger.info('---/subscriptions status [%s]---', statusId);
	return Promise.resolve();
}

/**
 * subscribe to a channel
 *
 * @param      {Object}    socket    The socket requesting the subscribe
 * @param      {Object}    data      The data the socket sent along
 * @param      {Function}  callback  Callback for sending the reply to socket
 * @return     {Object} null
 */
function subscribe(socket, data, callback) {
	let subscriptionId = uuidv4();
	logger.info(
        'socket %s subscribes to channel %s with subscriptionId=%s',
        socket.id, data.channel, subscriptionId
    );
	/**
	 * dispatches response back to socket
	 * and adds subscriptionID
	 *
	 * @param      {String}  eventName  The event name
	 * @param      {Object}  data       The returned data
	 */
	function dispatchResponse(eventName, data) {
		let reply = {
			response: 200,
			subscriptionId: subscriptionId,
			data: data,
		};
		socket.emit(eventName, reply);
	}

	if (channels[data.channel]) {
		channels[data.channel].createSubscription(dispatchResponse, data.args || {})
			.then((subscription) => {
				subscriptions[subscriptionId] = {
					channel: data.channel,
					socket: socket,
					subscription: subscription,
				};
				let reply = {
					response: 200,
					subscriptionId: subscriptionId,
					data: subscription.initialResponse,
				};
				return callback(reply);
			})
			.catch((e) => {
				logger.error('subscribe failed: %j', e);
				let reply = {
					response: 500,
					message: e.message,
				};
				return callback(reply);
			});
	} else {
		let reply = {
			response: 400,
			message: 'No such channel',
		};
		logger.info('No such channel %s', data.channel);
		return callback(reply);
	}
}

/**
 * unsubscribe from a channel
 *
 * @param      {Object}    socket    The socket requesting the unsubscribe
 * @param      {type}    data      The data provided by the socket
 * @param      {Function}  callback  The callback for sending data back over the socket
 */
function unsubscribe(socket, data, callback) {
	logger.info('unsubscribe from ID %s', data.subscriptionId);

	_removeSubscription(data.subscriptionId).then((success) => {
		let responseCode = success ? 200 : 401;
		if (!callback) {
			return;
		}
		let reply = {
			response: responseCode,
		};
		return callback(reply);
	});
}

/**
 * subscribe a socket from all subscriptions
 *
 * @param      {String}  socketId  The socket identifier
 */
function unsubscribeAll(socketId) {
	logger.info('socket %s: unsubscribeAll called', socketId);
	for (let subscription in subscriptions) {
		if (Object.prototype.hasOwnProperty.call(subscriptions, subscription)) {
			if (subscriptions[subscription].socket.id === socketId) {
				_removeSubscription(subscription);
			}
		}
	}
}

module.exports = () => {
	return ({
		subscribe: subscribe,
		unsubscribe: unsubscribe,
		unsubscribeAll: unsubscribeAll,
		status: status,
	});
};
