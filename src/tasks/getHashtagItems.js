const logs = require('../logs')(module);
module.exports = function(web3) {
	return ({
		getHashtagItems: function(hashtag) {
			const returnObject = {
				'hashtagData': {
					'name': 'Settler', 
					'stats': { 
						 'paidNoConflict': 69, 
						 'resolved': 23, 
						 'seekers': 42, 
						 'providers': 12
					}, 
					'description': 'Settler is the first amazing hashtag', 
					'maintainer': { 
						'avatar': base64,     
						'username': 'Mungo Weber', 
						'address': '0x3847F87F3EcF4a0e57djF73B2Db92134e1983ef5', 
					},
					'hashtagFee': 500000000000000000,
					'items': [{   
						'itemHash': '4a9v87bd98m1w',
						'seeker': {
							'username': 'Harry Humble',
							'avatar': base64,
							'address': '0x369D787F3EcF4a0e57cDfCFB2Db92134e1982e09',
							'rep': 4
						},
						'value': 12000000000000000000,
						'description': 'Ipsum looking for a ride to the airport',
						'dateTime': 1510715834,
						'location': 'guyhguzvzzpg' 
					}]
				},    	
			};
			return new Promise((resolve, reject) => {
				logs.info('HashtagsItems: ', returnObject);
				resolve(returnObject);
			});
		},
	});
};
