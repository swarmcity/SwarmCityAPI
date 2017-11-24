require('./environment');
const logger = require('./logs')('dumpenv');


let vars = ['ETHWS', 'APISOCKETPORT', 'IPFSAPI', 'PARAMETERSCONTRACT', 'PARAMETERSCONTRACTSTARTBLOCK'];


function showenv() {
	for (let i = 0; i < vars.length; i++) {
		logger.info(vars[i], '=\'' + process.env[vars[i]] + '\'');
	}
}

showenv();

