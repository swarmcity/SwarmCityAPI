'use strict';

exports.isAddress = function(address) {
	if (!/^(0x)?[0-9a-f]{40}$/i.test(address.toLowerCase())) {
		throw new Error('Address Invalid');
	} else if (/^(0x)?[0-9a-f]{40}$/.test(address.toLowerCase()) ||
		/^(0x)?[0-9A-F]{40}$/.test(address.toLowerCase())) {
		return true;
	} else {
		throw new Error('Address Invalid');
	}
};

exports.isJson = function(abi) {
	try {
		JSON.parse(abi);
	} catch (e) {
		throw new Error('ABI Is not JSON');
	}
	return true;
};
