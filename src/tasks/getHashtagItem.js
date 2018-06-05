const dbService = require('../services').dbService;

module.exports = function() {
	return ({
		getHashtagItem: function(address, itemHash) {
			return new Promise((resolve, reject) => {
				dbService.getHashtagItem(address, itemHash).then((item) => {
					resolve(item);
				});
			});
		},
	});
};
