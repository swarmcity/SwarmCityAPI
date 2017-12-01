'use strict';
const winston = require('winston');

module.exports = function(prefix) {
	const config = {
		configurable: true,
		value: function() {
			let alt = {};
			let storeKey = function(key) {
				alt[key] = key;
			};
			Object.getOwnPropertyNames(this).forEach(storeKey, this);
			return alt;
		},
	};
	Object.defineProperty(Error.prototype, 'toJSON', config); // eslint-disable-line

	const logger = winston.createLogger({
		format: winston.format.combine(
			winston.format.splat(), {
				transform: function(info, opts) {
					if (!info) return;
					info.message =
						info.message.reduce(function(res, cur) {
							if (typeof cur === 'object') {
								let append = JSON.stringify(cur);
								return res + ' ' + append;
							}
							return res + ' ' + cur;
						}, '');
					return info;
				},
			},
			winston.format.timestamp(),
			winston.format.printf((info) => {
				return `${info.timestamp} ${info.level}: ${prefix} - ${info.message}`;
			})
		),
		transports: [new winston.transports.Console({
			level: process.env.LOG_LEVEL || 'info',
		})],
	});

	return {
		info: function(...args) {
			logger.info.apply(logger, [args, {}]);
		},
		error: function(...args) {
			logger.error.apply(logger, [args, {}]);
		},
		warn: function(...args) {
			logger.warn.apply(logger, [args, {}]);
		},
		debug: function(...args) {
			logger.debug.apply(logger, [args, {}]);
		},
	};
};
