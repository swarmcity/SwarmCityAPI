const winston = require('winston');
const logger = new winston.Logger({
	transports: [
		new winston.transports.Console({
			handleExceptions: true,
			json: false,
			colorize: true,
			timestamp: true,
		}),
	],
	exitOnError: false,
});


module.exports = function() {
	return Object.assign(logger, {
		/**
		 * Significant events get logged as an audit trail
		 * @param {Object} item
		 * @param {Strring} type
		 */
		_eventLog: function(item, type) {
			logger.info(item);
		},
		/**
		 * Errors get logged
		 * @param {Object} item
		 * @param {Strring} type
		 */
		_errorLog: function(item, type) {
			logger.error(item);
		},
	});
};
