/**
 * This module will scan the blockchain for events on the parameter contract and will
 * keep an updated list with hashtags available for the getHashtags task. ( see tasks/ )
 */
'use strict';

require('../environment');
const logger = require('../logs')(module);
const web3 = require('../globalWeb3').web3;
const scheduledTask = require('../scheduler/scheduledTask')();
const hashtagListContract = require('../contracts/hashtagList.json');
const jsonHash = require('json-hash');

const dbService = require('../services').dbService;

/**
 * Gets the block height from the blockchain
 *
 * @return     {Promise}  The block height.
 */
async function getHashtagList() {
	// hashtagName   string :  Settler
	// hashtagMetaIPFS   string :  zb2rhbixVsHPSfBCUowDPDpkQ4QZR84rRpBSDym44i57NWmtE
	// hashtagAddress   address :  0x3a1a67501b75fbc2d0784e91ea6cafef6455a066
	// hashtagShown   bool :  false

	const hashtagListContractInstance = new web3.eth.Contract(
		hashtagListContract.abi,
		process.env.HASHTAG_LIST_ADDRESS
	);
	const numberOfHashtags = parseFloat(
		await hashtagListContractInstance.methods.numberOfHashtags().call()
	);
	let hashtags = [];
	for (let i = 0; i < numberOfHashtags; i++) {
		try {
			const hashtag = await hashtagListContractInstance.methods.readHashtag(i).call();
			hashtags.push({
				hashtagName: hashtag.hashtagName,
				hashtagMetaIPFS: hashtag.hashtagMetaIPFS,
				hashtagAddress: hashtag.hashtagAddress,
				hashtagShown: hashtag.hashtagShown,
			});
		} catch (e) {
			logger.error('Error retrieving hashtag #' + i + ' from hashtagList, err: ' + e);
		}
	}
	return hashtags;
}

module.exports = function() {
	return ({
		start: function() {
			// start up this task... print some parameters
			logger.info('process.env.HASHTAG_LIST_ADDRESS=%s',
				process.env.HASHTAG_LIST_ADDRESS);
			logger.info('process.env.HASHTAG_LIST_STARTBLOCK=%s',
				process.env.HASHTAG_LIST_STARTBLOCK);

			return new Promise((jobresolve, reject) => {
				scheduledTask.addTask({
					name: 'hashtagIndexerTask',
					interval: 10 * 1000,
					func: (task) => {
						return getHashtagList()
						.then((hashtags) => {
							jobresolve();
							let resHash = jsonHash.digest(hashtags);
							if (task.data.resHash !== resHash) {
								// If changed, store in the database and forward to clients
								task.data.resHash = resHash;
								return dbService.setHashtags(hashtags);
							}
						});
					},
					data: {},
				});
			});
		},

		stop: function() {
			return new Promise((resolve, reject) => {
				resolve();
			});
		},

		reset: function() {
			logger.info(
				'Reset hashtagsIndexer. SetLastBlock to %i',
				process.env.HASHTAG_LIST_STARTBLOCK
			);
		},
	});
};
