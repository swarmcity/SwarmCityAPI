'use strict';

const logs = require('../logs')();

module.exports = function() {
	return ({
		getHashtags: function(address) {
			const hashtags = [{
				contractAddress: '0x000',
				hashtagName: 'FaffyDeeRides',
				hashtagBalance: '233',
				hashtagItems: 31,
			}, {
				contractAddress: '0x000',
				hashtagName: 'SponnetShop',
				hashtagBalance: '102',
				hashtagItems: 11,
			}];
			return new Promise((resolve, reject) => {
				logs.info('Hashtags: ', hashtags);
				resolve(hashtags);
			});
		},
	});
};
