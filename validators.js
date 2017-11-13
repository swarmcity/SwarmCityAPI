'use strict';

exports.isAddress = function(address) {
	if (!address){
		return false;
	}
	if (!/^(0x)?[0-9a-f]{40}$/i.test(address.toLowerCase())) {
		return false;
	} else if (/^(0x)?[0-9a-f]{40}$/.test(address.toLowerCase()) ||
		/^(0x)?[0-9A-F]{40}$/.test(address.toLowerCase())) {
		return true;
	} else {
		return false;
	}
};

exports.isJson = function(abi) {
	try {
		JSON.parse(abi);
	} catch (e) {
		return false;
	}
	return true;
};
