'use strict'

/**
 * @class
 * @param {string} jsonType
 * @param {checkCallback} checkFn
 * @param {toJSONCallback|string} [toJSON]
 * @param {toJSONSchemaCallback} [toJSONSchema]
 */
function Type(jsonType, checkFn, toJSON, toJSONSchema) {
	var types = ['number', 'string', 'boolean', 'object', 'array', '*', 'raw']

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

	/** @member {?toJSONSchemaCallback} */
	this._toJSONSchema = toJSONSchema
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
	if (this.jsonType !== 'raw' &&
		value !== null &&
		value !== undefined &&
		typeof value.toJSON === 'function') {
		value = value.toJSON()
	}

	var type, ret
	if (Array.isArray(value)) {
		type = 'array'
	} else if (value === null) {
		type = 'null'
	} else if (typeof value === 'number' && isNaN(value)) {
		type = 'NaN'
	} else if (value === Infinity || value === -Infinity) {
		type = 'infinity'
	} else {
		type = typeof value
	}
	if (this.jsonType !== '*' &&
		this.jsonType !== 'raw' &&
		this.jsonType !== type) {
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
		(this.jsonType === 'string' && value === '')
}

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

	// Aproximated convertion
	return {
		number: '$Number',
		string: '$String',
		boolean: '$Boolean',
		object: '$Object',
		array: '$Array',
		'*': '*',
		raw: '*'
	}[this.jsonType]
}

/**
 * Function called when coverting to JSON Schema
 * Only core types can be precisely defined
 * Custom types are represented by their parent JSON-type
 * @param {*} extra
 * @param {boolean} expandTypedefs
 * @returns {Object}
 */
Type.prototype.convertToJSONSchema = function (extra, expandTypedefs) {
	if (this._toJSONSchema) {
		return this._toJSONSchema(extra, expandTypedefs)
	}

	// Aproximated convertion
	var jsonSchemaType = {
		number: 'number',
		string: 'string',
		boolean: 'boolean',
		object: 'object',
		array: 'array'
	}[this.jsonType]

	if (!jsonSchemaType) {
		throw new Error('This type cannot be converted to JSON Schema')
	}

	return {
		type: jsonSchemaType
	}
}