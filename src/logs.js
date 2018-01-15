'use strict';
const winston = require('winston');

const scFormat = winston.format.printf((info) => {
    let level = info.level.toUpperCase();
    let message = info.message
    let filtered_info = Object.assign({}, info, {
        'level': undefined,
        'message': undefined,
        'splat': undefined,
        'label': undefined,
        'timestamp': undefined,
    });
    let append = JSON.stringify(filtered_info);
    if (append != '{}') {
        message = message + ' ' + append;
    }
    return `${info.timestamp} ${level} [${info.label}] : ${message}`;
});

function _getLabel(mod) {
    if (mod == undefined) {
        mod = module;
    }
    let label = mod.id || mod;
    return winston.format.label({'label': label});
}

module.exports = function(mod) {
	const logger = winston.createLogger({
        level: process.env.LOG_LEVEL || 'info',
		format: winston.format.combine(
			winston.format.splat(),
			winston.format.timestamp(),
            _getLabel(mod),
            scFormat
		),
		transports: [new winston.transports.Console()],
	});
    return logger;
};
