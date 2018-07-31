const dbService = require('../services').dbService;

module.exports = function() {
	return ({
		getHashtagItems: function(hashtag) {
			return new Promise((resolve, reject) => {
				dbService.getHashtagDeals(hashtag.address).then((items) => {
					dbService.getHashtag(hashtag.address).then((hashtag) => {
						const hashtagDefaultInfo = {
								'name': 'Settler',
								'stats': {
									'paidNoConflict': 69,
									'resolved': 23,
									'seekers': 42,
									'providers': 12,
								},
								'description': 'Settler is the first amazing hashtag',
								'maintainer': {
									'avatarHash': '',
									'username': 'Mungo Weber',
									'address': '0x3847F87F3EcF4a0e57djF73B2Db92134e1983ef5',
								},
								'hashtagFee': 500000000000000000,
								'items': items,
						};
						// Object.assign(secondary, primary);
						const hashtagInfo = Object.assign(hashtagDefaultInfo, hashtag);
						resolve(hashtagInfo);
					});
				});
			});
		},
	});
};
