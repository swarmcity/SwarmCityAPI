'use strict';

const validate = require('../../validators');

/**
 * clean up a task from the scheduler when socket wants to unsubscribe
 *
 * @param      {String}   reply The hashtag smart contract address
 * @return     {Object}  result of removing the task (no return value)
 */
function parseReplyRequest(reply) {
    const args = JSON.parse(reply);

    if (!args || !args.itemHash) {
		throw new Error(
            'Cannot create a selectee without a valid itemHash.'
        );
	}
	if (!args.hashtagAddress || !validate.isAddress(args.hashtagAddress)) {
		throw new Error(
            'Cannot create a selectee without a valid hashtagAddress.'
        );
	}
	if (!args.selectee || typeof args.selectee !== typeof {}) {
		throw new Error(
            'Cannot create a selectee without a valid selectee.'
        );
    }
    if (!args.selectee || !args.selectee.address || !validate.isAddress(args.selectee.address)) {
		throw new Error(
            'Cannot create a selectee without a valid selectee address.'
        );
	}
	if (!args.reply || typeof args.reply !== typeof {}) {
		throw new Error(
            'Cannot create a selectee without a valid reply.'
        );
    }
    return args;
}

module.exports = parseReplyRequest;
