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

	/** @member {?checkCallback} */
	this.preHook = null

	/** @member {?checkCallback} */
	this.postHook = null
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

	// Span-out partial fields
	// Use `false` to mark leaf fields. This is a hack to make `if (tree[part])` check for a non-leaf field
	// ['a.b.c'] -> {a: {b: {c: false}}}
	// ['a', 'b.c'] -> {a: false, b: {c: false}}
	// ['a', 'a.b'] -> {a: {b: false}}
	// ['a.b', 'a'] -> {a: {b: false}}
	if (options.partial) {
		options._partialTree = Object.create(null)

		for (let each of options.partial) {
			let parts = each.split('.'),
				tree = options._partialTree,
				len = parts.length

			for (let i = 0; i < len - 1; i++) {
				let part = parts[i]
				if (!tree[part]) {
					// Add sub-tree if there wasn't any or `false` denoting a leaf field
					tree[part] = Object.create(null)
				}
				tree = tree[part]
			}

			let lastPart = parts[len - 1]
			if (!lastPart[lastPart]) {
				// Only mark the leaf field if it doesn't overwrite a previous non-leaf field
				tree[lastPart] = false
			}
		}
	}

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
 * Apply prehook
 * @param {*} the original value (NOTE: this can be modified, make a copy if you need the original back)
 * @param {string} path
 * @param {Object} options
 * @returns {*} the parsed value
 * @throws {ValidationError}
 */
Field.prototype._applyPreHook = function (value, path, options) {
	try {
		let pre = this.preHook(value, this.extra, options, path)
		return pre === undefined ? value : pre
	} catch (e) {
		if (typeof e === 'string') {
			// Convert from string to error
			throw new ValidationError(e, path)
		}
		throw e
	}
}

/**
 * Check if the value is valid
 * @param {*} the original value (NOTE: this can be modified, make a copy if you need the original back)
 * @param {string} path
 * @param {Object} options
 * @param {boolean} [skipPreHook=false]
 * @returns {*} the parsed value
 * @throws {ValidationError}
 */
Field.prototype._validate = function (value, path, options, skipPreHook = false) {
	try {
		if (!skipPreHook && this.preHook) {
			let pre = this.preHook(value, this.extra, options, path)
			value = pre === undefined ? value : pre
		}
		value = this.type.validate(value, path, this.extra, options)
		if (this.postHook) {
			let post = this.postHook(value, this.extra, options, path)
			value = post === undefined ? value : post
		}
		return value
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
 * Only core types can be precisely represented
 * Custom types are represented by their parent JSON-type
 * @param {string} [componentsPath] - if given, internal typedefs are returned as references
 * @param {boolean} [forceRef] - if true, return a $ref at the first level when possible
 * @returns {Object}
 */
Field.prototype.toJSONSchema = function (componentsPath, forceRef) {
	if (forceRef && this.typedefName && componentsPath) {
		return {
			$ref: componentsPath + '/' + this.typedefName
		}
	}
	return this.type.convertToJSONSchema(this.extra, componentsPath)
}