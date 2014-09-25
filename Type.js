'use strict'

/**
 * @class
 * @param {string} jsonType
 * @param {checkCallback} checkFn
 * @param {toJSONCallback|string} [toJSON]
 */
function Type(jsonType, checkFn, toJSON) {
	if (typeof jsonType !== 'string') {
		throw new Error('jsType must be a string')
	} else if (jsonType !== 'number' && jsonType !== 'string' && jsonType !== 'boolean' && jsonType !== 'object' && jsonType !== 'array') {
		throw new Error('jsType must be one of: number, string, boolean, object, array')
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
	var type = typeof value,
		ret
	if (this.jsonType === 'array' && !Array.isArray(value)) {
		throw new Error('I was expecting an array and you gave me ' + type + ' in ' + path)
	} else if (this.jsonType !== 'array' && this.jsonType !== type) {
		throw new Error('I was expecting ' + this.jsonType + ' and you gave me ' + type + ' in ' + path)
	}
	ret = this.checkFn(value, path, extra, options)
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
	var typesMap = {
			number: Number,
			string: String,
			boolean: Boolean,
			object: Object,
			array: Array
		},
		type = parse(typesMap[this.jsonType])

	return type.toJSON()
}