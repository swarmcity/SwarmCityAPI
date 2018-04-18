/**
 * Subscription manager for 'Nonce'
 */
'use strict';
const logger = require('../logs.js')(module);
const validate = require('../validators');
const scheduledTask = require('../scheduler/scheduledTask')();

const dbService = require('../services').dbService;

/**
 * clean up a task from the scheduler when socket wants to unsubscribe
 *
 * @param      {Object}   task    The task
 * @return     {Promise}  result of removing the task (no return value)
 */
async function cancelSubscription(task) {
    logger.info('cancelSubscripton to ShortCode called.');

    if (task.data && task.data.shortCode) {
        let shortCode = task.data.shortCode;
        let _removeShortCodeTask = {
            name: 'removeShortCode',
            func: (task) => {
                logger.debug('Delete ShortCode %s from the db.', shortCode);
                return dbService.deleteShortCode(shortCode);
            },
            data: {},
        };
        await scheduledTask.addTask(_removeShortCodeTask);
        logger.debug('Scheduled removing of ShortCode %s.', shortCode);
        return true;
    }
    return false;
}

/**
 * create random ShortCode
 *
 * @param      {number}  decimals  The decimals
 * @return     {string}  a ShortCode
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
 * @param      {Number}   decimals  decimals of the ShortCode
 * @return     {Promise}  resolves with new value.
 */
async function createUniqueShortCode(decimals) {
	let newShortCode = createShortCode(decimals);

    try {
        let shortCode = await dbService.readShortCode(newShortCode, true);
        if (shortCode) {
            return createUniqueShortCode(decimals);
        }
    } catch (error) {
        return newShortCode;
    }
}

/**
 * Creates a subscription.
 *
 * @param      {Function} 	emitToSubscriber the function to call when you want to emit data
 * @param      {Object}  	args    The parameters sent with the subscription
 * @return     {Promise}  	resolves with the subscription object
 */
async function createSubscription(emitToSubscriber, args) {
	let validity = stdValidity;

    let payload = {};

	if (!args || !args.address || !validate.isAddress(args.address)) {
		throw new Error(
            'Cannot create a ShortCode without a valid address.'
        );
	}
    payload.address = args.address;
	if (!args || !args.userName) {
		throw new Error(
            'Cannot create a ShortCode without a valid UserName.'
        );
	}
    payload.userName = args.userName;
	if (!args || !args.avatar) {
		throw new Error(
            'Cannot create a ShortCode without a valid avatar.'
        );
    }
    payload.avatar = args.avatar;

	logger.info('Creating a ShortCode for %s', args.address);

    let shortCode = await createUniqueShortCode(5);

    await dbService.saveDataToShortCode(shortCode, validity, payload);

    return {
        task: {
            name: 'createShortCode',
            func: (task) => {},
            responsehandler: (res, task) => {},
            data: {
                'address': args.address,
                'shortCode': shortCode,
            },
        },
        initialResponse: {
            'shortCode': shortCode,
            'validity': validity,
        },
        cancelSubscription: cancelSubscription,
    };
}

module.exports = function() {
	return ({
		name: 'createShortCode',
		createSubscription: createSubscription,
	});
};
