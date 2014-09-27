'use strict'

/**
 * @class
 * @private
 * @param {string} message
 * @param {string} path
 */
function ValidationError(message, path) {
	/** @member {string} */
	this.message = message
	/** @member {string} */
	this.path = path
}

module.exports = ValidationError