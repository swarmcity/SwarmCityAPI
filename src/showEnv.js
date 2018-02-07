require('./environment');
const logger = require('./logs')(module);

let vars = [
    'ETHWS',
    'NETWORK',
    'APISOCKETPORT',
    'IPFSAPI',
    'IPFSAPIHOST',
    'IPFSAPIPORT',
    'PARAMETERSCONTRACT',
	'PARAMETERSCONTRACTSTARTBLOCK',
    'SWT',
    'SWTBALANCE',
    'ARC',
    'ARCBALANCE',
    'TESTIPFS',
];

/**
 * Print out selected ENV vars to the log
 */
function showEnv() {
    vars.forEach((variable) => {
		logger.info('%s =\'%s\'', variable, process.env[variable]);
	});
}

module.exports = {
    'showEnv': showEnv,
};
