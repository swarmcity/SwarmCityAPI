'use strict';
const winston = require('winston');

module.exports = function(prefix) {
	const logger = winston.createLogger({
		format: winston.format.combine({
				transform: function(info, opts) {
					if (!info) return;
					info.message =
						(prefix ? ' ' + prefix + ': ' : '') +
						info.message.reduce(function(res, cur) {
							if (typeof cur === 'object') {
								return res + JSON.stringify(cur, Object.getOwnPropertyNames(cur));
							}
							return res + ' ' + cur;
						}, '');
					return info;
				}
			},
			winston.format.timestamp(),
			winston.format.splat(),
			winston.format.printf(info => {
				return `${info.timestamp} ${info.level}:${info.message}`;
			})
		),
		transports: [new winston.transports.Console({
			level: process.env.LOG_LEVEL || 'info'
		})],
	});

	return {
		info: function() {
			logger.info.apply(logger, [
				[].slice.call(arguments), {}
			]);
		},
		error: function() {
			logger.error.apply(logger, [
				[].slice.call(arguments), {}
			]);
		},
		warn: function() {
			logger.warn.apply(logger, [
				[].slice.call(arguments), {}
			]);
		},
		debug: function() {
			logger.debug.apply(logger, [
				[].slice.call(arguments), {}
			]);
		},
	};
};
