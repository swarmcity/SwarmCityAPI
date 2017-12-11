'use strict';

exports.isAddress = function(address) {
	if (!address || !(typeof address === 'string')) {
		return false;
	}
    return /^(0x)?[0-9a-f]{40}$/i.test(address);
};

exports.isJson = function(abi) {
	try {
		JSON.parse(abi);
	} catch (e) {
		return false;
	}
	return true;
};
