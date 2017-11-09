const logs = require('../logs.js')();
module.exports = function(web3) {
	return ({
		_getHashtagItems: function(hashtag) {
			const returnObject = [{},
				{
					'response': 200,
					'hashtagData': [{
						'hashtagMaintainer': '0xA4E3e53e89e575b32249e6105dA159a4f48D34de',
						'hashtagName': 'BoardwalkTest',
						'hashtagDescription': 'This is the testing hashtag for Boardwalk v2',
						'hashtagItems': 4,
						'hashtagContact': [
							{
								'contactName': 'Bernd Lapp',
								'contactLink': 'https://twitter.com/BerndLapp',
							},
						],
					}],
					'itemsData': [{
						'itemId': '0x000',
						'name': 'Faffy D',
						'avatar': 'IPFS',
						'balance': 10,
						'description': 'Need a ride from McDonalds Meir to CryptoSpot',
						'dateTime': 1508335855072,
						'location': 'u1557fpvm1hb',
						'value': 12,
					},
					{
						'itemId': '0x000',
						'name': 'Faffy D',
						'avatar': 'IPFS',
						'balance': 10,
						'description': 'Need a ride from McDonalds Meir to CryptoSpot',
						'dateTime': 1508335855072,
						'location': 'u1557fpvm1hb',
						'value': 12,
					},
					{
						'itemId': '0x000',
						'name': 'Faffy D',
						'avatar': 'IPFS',
						'balance': 10,
						'description': 'Need a ride from McDonalds Meir to CryptoSpot',
						'dateTime': 1508335855072,
						'location': 'u1557fpvm1hb',
						'value': 12,
					}],
				}];
			return new Promise((resolve, reject) => {
				logs._eventLog('HashtagsItems: ', returnObject);
				resolve(returnObject);
			});
		},
	});
};
