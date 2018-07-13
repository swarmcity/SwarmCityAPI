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
            'Cannot create a replyRequest without a valid itemHash.'
        );
	}
	if (!args.hashtagAddress || !validate.isAddress(args.hashtagAddress)) {
		throw new Error(
            'Cannot create a replyRequest without a valid hashtagAddress.'
        );
	}
	if (!args.replier || typeof args.replier !== typeof {}) {
		throw new Error(
            'Cannot create a replyRequest without a valid replier.'
        );
    }
    if (!args.replier || !args.replier.address || !validate.isAddress(args.replier.address)) {
		throw new Error(
            'Cannot create a replyRequest without a valid replier/provider address.'
        );
	}
	if (!args.description) {
		throw new Error(
            'Cannot create a replyRequest without a valid description.'
        );
    }
    return args;
}

module.exports = parseReplyRequest;
