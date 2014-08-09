'use strict'

/**
 * @class
 * @param {string} jsonType
 * @param {checkCallback} checkFn
 */
function Type(jsonType, checkFn) {
	if (typeof jsonType !== 'string') {
		throw new Error('jsType must be a string')
	} else if (jsonType !== 'number' && jsonType !== 'string' && jsonType !== 'boolean' && jsonType !== 'object' && jsonType !== 'array') {
		throw new Error('jsType must be one of: number, string, boolean, object, array')
	} else if (typeof checkFn !== 'function') {
		throw new Error('checkFn must be a function')
	}

	this.jsonType = jsonType
	this.checkFn = checkFn
}

module.exports = Type

/**
 * @property {string} jsonType
 */
Type.prototype.jsonType

/**
 * @property {function} checkFn
 */
Type.prototype.checkFn

/**
 * Check if a given value has the right type
 * @param {*} value
 * @param {string} path
 * @param {*} extra
 * @returns {*} the validated value
 * @throws if invalid
 */
Type.prototype.validate = function (value, path, extra) {
	var type = typeof value,
		ret
	if (this.jsonType === 'array' && !Array.isArray(value)) {
		throw new Error('I was expecting an array and you gave me ' + type + ' in ' + path)
	} else if (this.jsonType !== 'array' && this.jsonType !== type) {
		throw new Error('I was expecting ' + this.jsonType + ' and you gave me ' + type + ' in ' + path)
	}
	ret = this.checkFn(value, path, extra)
	return ret === undefined ? value : ret
}

/**
 * @param {*} value
 * @returns {boolean} whether the given value is considered empty
 */
Type.isEmpty = function (value) {
	return value === '' ||
		value === undefined ||
		value === null ||
		(Array.isArray(value) && value.length === 0)
}