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
const IPFSTask = require('../scheduler/IPFSTask')();

const dbService = require('../services').dbService;
const ipfsService = require('../services').ipfsService;

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
				stats: {'paidNoConflict': 0, 'resolved': 0, 'seekers': 0, 'providers': 0},
				description: '',
				hashtagFee: 0,
			});
		} catch (e) {
			logger.error('Error retrieving hashtag #' + i + ' from hashtagList, err: ' + e);
		}
	}
	return hashtags;
}

/**
 * Gets the block height from the blockchain
 *
 * @param     {Object}  hashtag The block height.
 */
function resolveHashtagMetadata(hashtag) {
	// { hashtagName: 'Settler',
	// 	hashtagMetaIPFS: 'zb2rhjRoj3v87kvser9pjj7nrrMRanwHJbu6Wh92WXUTWrKKh',
	// 	hashtagAddress: '0x3a1A67501b75FBC2D0784e91EA6cAFef6455A066',
	// 	hashtagShown: true },

	IPFSTask.addTask({
		count: 1,
		func: (task) => {
			return ipfsService.cat(task.data.hash);
		},
		responsehandler: async (res, task) => {
			if (task.error === 'Error: this dag node is a directory') {
				return;
			} else if (task.error === 'Error: IPFS request timed out'
				|| task.error === 'Error: read ECONNRESET') {
				task.error = null;
				task.count = task.count * 10;
				if (task.count > 172800) {
					logger.error('Error on hash %s: %s',
						task.data.hash,
						task.error);
					return;
				}
				task.nextRun = (new Date).getTime() + task.count * 1000;
				logger.debug('Timeout on hash %s', task.data.hash);
				IPFSTask.addTask(task);
				return;
			} else if (task.error) {
				IPFSTask.addTask(task);
				return;
			}
			// Object.assign(secondary, primary);
			// dbService.updateHashtag(hashtagAddress, hastagObject);
			await dbService.setHashtag(
				hashtag.hashtagAddress,
				// Data from the contract overwrites the IPFS metadata
				Object.assign(res, hashtag)
			);
			return;
		},
		data: {
			hash: hashtag.hashtagMetaIPFS,
		},
	});
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
								// [ { hashtagName: 'Settler',
								// 	hashtagMetaIPFS: 'zb2rhjRoj3v87kvser9pjj7nr...
								// 	hashtagAddress: '0x3a1A67501b75FBC2D0784e91EA6cAFef6455A066',
								// 	hashtagShown: true },
								//  ...
								// If changed, store in the database and forward to clients
								task.data.resHash = resHash;
								for (const hashtag of hashtags) {
									// Resolve IPFS metadata in the background
									resolveHashtagMetadata(hashtag);
								}
								dbService.setHashtags(hashtags);
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
