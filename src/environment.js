'use strict';

// mixin the environment variables defined in .env
require('dotenv').config({
	path: '.env',
});

const contracts = require('./contracts/index.json');
const NETWORK = process.env['NETWORK'] || 'kovan';
const contractConfig = contracts[NETWORK];

process.env.HASHTAGPROXYCONTRACT = contractConfig['hashtagproxycontract']['address'];
process.env.HASHTAGPROXYSTARTBLOCK = contractConfig['hashtagproxycontract']['startblock'];

// #### Temporal fix, fallback value for HASHTAG_CONTRACT
process.env.HASHTAG_CONTRACT =
	process.env.HASHTAG_CONTRACT
	|| '0x3a1a67501b75fbc2d0784e91ea6cafef6455a066';

['ARC', 'SWT'].forEach((token) => {
    process.env[token] = contractConfig['tokens'][token]['address'];
    process.env[token+'STARTBLOCK'] = contractConfig['tokens'][token]['startblock'] || 1;
    process.env[token+'BALANCE'] = contractConfig['balances'][token] || '';
});
