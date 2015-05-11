'use strict'

/**
 * @class
 * @param {string} jsonType
 * @param {checkCallback} checkFn
 * @param {toJSONCallback|string} [toJSON]
 */
function Type(jsonType, checkFn, toJSON) {
	var types = ['number', 'string', 'boolean', 'object', 'array', '*']

	if (typeof jsonType !== 'string') {
		throw new Error('jsType must be a string')
	} else if (types.indexOf(jsonType) === -1) {
		throw new Error('jsType must be one of: ' + types.join(', '))
	} else if (typeof checkFn !== 'function') {
		throw new Error('checkFn must be a function')
	}

	/** @member {string} */
	this.jsonType = jsonType

	/** @member {Function} */
	this.checkFn = checkFn

	/** @member {?(toJSONCallback|string)} */
	this._toJSON = toJSON
}

module.exports = Type

/**
 * Check if a given value has the right type
 * @param {*} value
 * @param {string} path
 * @param {*} extra
 * @param {Object} options
 * @returns {*} the validated value
 * @throws if invalid
 */
Type.prototype.validate = function (value, path, extra, options) {
	// Call toJSON() if present
	if (value !== null && value !== undefined && typeof value.toJSON === 'function') {
		value = value.toJSON()
	}

	var type = Array.isArray(value) ? 'array' : (value === null ? 'null' : typeof value),
		ret
	if (this.jsonType !== '*' && this.jsonType !== type) {
		throw 'I was expecting ' + this.jsonType + ' and you gave me ' + type
	}
	ret = this.checkFn(value, extra, options, path)
	return ret === undefined ? value : ret
}

/**
 * @param {*} value
 * @returns {boolean} whether the given value is considered empty
 */
Type.prototype.isEmpty = function (value) {
	return value === undefined ||
		value === null ||
		(this.jsonType === 'string' && value === '') ||
		(this.jsonType === 'array' && Array.isArray(value) && value.length === 0)
}

// Lazy loaded require('./index').parse
var parse

/**
 * Function called when stringifying a Field instance
 * Only core types can be precisely stringified
 * Custom types are represented by their parent JSON-type
 * @param {*} extra
 * @returns {*}
 */
Type.prototype.convertToJSON = function (extra) {
	if (this._toJSON) {
		return typeof this._toJSON === 'function' ? this._toJSON(extra) : this._toJSON
	}

	// Lazy loading
	parse = parse || require('./index').parse

	// Aproximated convertion
	return {
		number: '$Number',
		string: '$String',
		boolean: '$Boolean',
		object: '$Object',
		array: '$Array',
		'*': '*'
	}[this.jsonType]
}