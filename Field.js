'use strict'

/**
 * @class
 * @param {Type} type
 * @param {*} extra
 */
function Field(type, extra) {
	this.type = type
	this.extra = extra
}

module.exports = Field

/**
 * @property {Type} type
 */
Field.prototype.type

/**
 * @property {*} extra
 */
Field.prototype.extra

/**
 * Check if the value is valid
 * @param {*} the original value (NOTE: this can be modified, make a copy if you need the original back)
 * @param {string} [path] used internally
 * @returns {*} the parsed value
 * @throws if is invalid
 */
Field.prototype.validate = function (value, path) {
	return this.type.validate(value, path || '', this.extra)
}