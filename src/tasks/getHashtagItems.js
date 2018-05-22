const logs = require('../logs')(module);
const dbService = require('../services').dbService;

module.exports = function() {
	return ({
		getHashtagItems: function(hashtag) {
			return new Promise((resolve, reject) => {
				dbService.getHashtagDeals(hashtag.address).then((items) => {
					let hashtagInfo = {
						'hashtagData': {
							'hashtagMaintainer': '0x9258385b6bad9b1f6d5374b063b8c4b63c5b7191',
							'hashtagName': 'Settler',
							'hashtagDescription': 'This is the testing hashtag for Boardwalk v2',
							'hashtagItems': items.length,
							'hashtagContact': [{
								'contactName': 'Bernd Lapp',
								'contactLink': 'https://twitter.com/BerndLapp',
							}],
						}, 'itemsData': items,
					};

					logs.info('HashtagsItems: ', hashtagInfo);
					resolve(hashtagInfo);
				});
			});
		},
	});
};
