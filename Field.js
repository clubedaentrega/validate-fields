'use strict'

/**
 * @class
 * @param {Type} type
 * @param {*} extra
 */
function Field(type, extra) {
	/** @member {Type} */
	this.type = type

	/** @member {*} */
	this.extra = extra

	/** @member {string} */
	this.lastError = ''

	/** @member {?string} */
	this.typedefName = null
}

module.exports = Field

let ValidationError = require('./ValidationError')

/**
 * Check if the value is follows the fields schema
 * @param {*} value The value can be altered by the validation
 * @param {Object} [options] object that will be passed to every validator
 * @returns {boolean} whether the value is valid or nor
 */
Field.prototype.validate = function (value, options) {
	options = options || {}
	try {
		this._validate(value, '', options)
	} catch (e) {
		if (e instanceof ValidationError) {
			this.lastError = e.message + ' in ' + e.path
			this.lastErrorMessage = e.message
			this.lastErrorPath = e.path
			return false
		}
			throw e

	}
	this.lastError = ''
	return true
}

/**
 * Check if the value is valid
 * @param {*} the original value (NOTE: this can be modified, make a copy if you need the original back)
 * @param {string} path
 * @param {Object} options
 * @returns {*} the parsed value
 * @throws {ValidationError}
 */
Field.prototype._validate = function (value, path, options) {
	try {
		return this.type.validate(value, path, this.extra, options)
	} catch (e) {
		if (typeof e === 'string') {
			// Convert from string to error
			throw new ValidationError(e, path)
		}
		throw e
	}
}

/**
 * Function called by JSON.stringify() applied to a Field instance
 * Only core types can be precisely stringified
 * Custom types are represented by their parent JSON-type
 * @returns {*}
 */
Field.prototype.toJSON = function () {
	return this.type.convertToJSON(this.extra)
}

/**
 * Function called when coverting to JSON Schema
 * Only core types can be precisely stringified
 * Custom types are represented by their parent JSON-type
 * @param {boolean} [expandTypedefs=false] - if false, typedefs are returned as references
 * @returns {Object}
 */
Field.prototype.toJSONSchema = function (expandTypedefs) {
	if (this.typedefName && !expandTypedefs) {
		return {
			$ref: '#/definitions/' + this.typedefName
		}
	}
	return this.type.convertToJSONSchema(this.extra, Boolean(expandTypedefs))
}