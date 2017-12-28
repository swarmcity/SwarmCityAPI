'use strict';
require('dotenv').config({
	path: '../.env',
});
const web3 = require('../globalWeb3');
const should = require('should');

describe('test of globalWeb3', function() {
	it('shhHash test', function(done) {
		should(web3.shhHelpers.shhHash('test')).equal('0x1e4b98be');
		done();
	});
});
