'use strict';

// mixin the environment variables defined in .env
require('dotenv').config({
	path: '.env',
});

const contracts = require('./contracts/index.json');
const NETWORK = process.env['NETWORK'] || 'rinkeby';
const contractConfig = contracts[NETWORK];

process.env.PARAMETERSCONTRACT = contractConfig['parameterscontract']['address'];
process.env.PARAMETERSCONTRACTSTARTBLOCK = contractConfig['parameterscontract']['startblock'];
['ARC', 'SWT'].forEach((token) => {
    process.env[token] = contractConfig['tokens'][token];
    process.env[token+'BALANCE'] = contractConfig['balances'][token] || '';
});
