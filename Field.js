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
 * @property {string} lastError
 */
Field.prototype.lastError

/**
 * Check if the value is follows the fields schema
 * @param {*} value The value can be altered by the validation
 * @returns {boolean} whether the value is valid or nor
 */
Field.prototype.validate = function (value) {
	try {
		this._validate(value, '')
	} catch (e) {
		this.lastError = e.message
		return false
	}
	this.lastError = ''
	return true
}

/**
 * Check if the value is valid
 * @param {*} the original value (NOTE: this can be modified, make a copy if you need the original back)
 * @param {string} path
 * @returns {*} the parsed value
 * @throws if is invalid
 */
Field.prototype._validate = function (value, path) {
	return this.type.validate(value, path, this.extra)
}