/**
 * This module will scan the blockchain for events on the parameter contract and will
 * keep an updated list with hashtags available for the getHashtags task. ( see tasks/ )
 */
'use strict';

require('../environment');
const logger = require('../logs')(module);
const web3 = require('../globalWeb3').web3;
const hashtagListContract = require('../contracts/hashtagList.json');
const jsonHash = require('json-hash');

const eventBus = require('../eventBus');
const dbService = require('../services').dbService;
const ipfs = require('../scheduler/IPFSQueueLight');

const hashtagDefaultValues = {
	stats: {'paidNoConflict': 0, 'resolved': 0, 'seekers': 0, 'providers': 0},
	description: '',
	hashtagFee: 0,
};

let dataHash = '';
/**
 * Gets the block height from the blockchain
 *
 * @param      {Json}     data  Data to check
 * @return     {Boolean}        Whether data has changed.
 */
function dataChanged(data) {
	const newDataHash = jsonHash.digest(data);
	const hasChanged = (dataHash !== newDataHash);
	dataHash = newDataHash;
	return hasChanged;
}

/**
 * Gets hashtags from the blockchain
 */
async function getHashtags() {
	const hashtagListContractInstance = new web3.eth.Contract(
		hashtagListContract.abi,
		process.env.HASHTAG_LIST_ADDRESS
	);
	const numberOfHashtags = parseFloat(
		await hashtagListContractInstance.methods.numberOfHashtags().call()
	);

	const hashtags = [];
	for (let i = 0; i < numberOfHashtags; i++) {
		const hashtag = await hashtagListContractInstance.methods.readHashtag(i).call();
		// hashtagName   string :  Settler
		// hashtagMetaIPFS   string :  zb2rhbixVsHPSfBCUowDPDpkQ4QZR84rRpBSDym44i57NWmtE
		// hashtagAddress   address :  0x3a1a67501b75fbc2d0784e91ea6cafef6455a066
		// hashtagShown   bool :  false
		hashtags.push({
			hashtagName: decodeURI(hashtag.hashtagName),
			hashtagMetaIPFS: hashtag.hashtagMetaIPFS,
			hashtagAddress: hashtag.hashtagAddress,
			hashtagShown: hashtag.hashtagShown,
		});
	}

	// Check if hashtag data has changed
	if (!dataChanged(hashtags)) {
		return;
	}

	dbService.setHashtags(hashtags);

	hashtags.forEach((hashtag) => {
		// Emit new hashtag found
		logger.info('New or changed hashtag: %s %s', hashtag.hashtagName, hashtag.hashtagAddress);
		eventBus.emit('hashtagChange', hashtag);

		ipfs.cat(hashtag.hashtagMetaIPFS)
		.catch((err) => {
			logger.error('Can\'t fetch hashtag: '+hashtag.hashtagName+' IPFS metadata. err: '+err);
			return {}; // Return empty object, which will be filled by defaults
		})
		.then(JSON.parse)
		.then((hashtagMetadata) => dbService.setHashtag(
			hashtag.hashtagAddress,
			// Combine objects by priority: Defaults < IPFS data < Contract data
			Object.assign(hashtagDefaultValues, hashtagMetadata, hashtag)
		));
	});
}

let subscription;

module.exports = function() {
	return ({
		start: () => {
			// Search immediatelly
			getHashtags();
			// Subscribe to new blocks
			logger.info(
				'Started to listen to HashtagList contract: =%s',
				process.env.HASHTAG_LIST_ADDRESS
			);
			eventBus.on('newBlockHeader', getHashtags);
			// Mantain legacy architecture

			return Promise.resolve();
		},

		stop: function() {
			return new Promise((resolve, reject) => {
				subscription.unsubscribe(function(error, success) {
					if (error) reject(error);
					else resolve(success);
				});
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
