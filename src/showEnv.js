require('./environment');
const logger = require('./logs')('dumpenv');


let vars = [
    'ETHWS',
    'APISOCKETPORT',
    'IPFSAPI',
    'IPFSAPIHOST',
    'IPFSAPIPORT',
    'PARAMETERSCONTRACT',
	'PARAMETERSCONTRACTSTARTBLOCK',
    'TESTSHH',
    'TESTIPFS',
];

/**
 * Print out selected ENV vars to the log
 */
function showenv() {
	for (let i = 0; i < vars.length; i++) {
		logger.info(vars[i], '=\'' + process.env[vars[i]] + '\'');
	}
}

showenv();
