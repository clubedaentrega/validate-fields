'use strict'

let ValidationError = require('../ValidationError')

module.exports = function (context) {
	/**
	 * Hash maps
	 * Example: {name: String, age: Number, dates: {birth: Date, 'death?': Date}}
	 * If the key name ends with '?' that field is optional
	 * After validation, a field will never be empty (like '' or []). If it's marked as optional, it will be either non-empty or not-present ('key' in obj === false)
	 *
	 * If options.strict is set, extraneous fields will be considered as invalid.
	 * Example: validate({}, {a: 2}, {strict: true}) // false: I wasn't expecting a value in a
	 */
	context.registerType((definition, parse) => {
		let extra

		if (typeof definition !== 'object' ||
			!definition ||
			(definition.constructor !== Object && Object.getPrototypeOf(definition) !== null)) {
			// Only match literal objects like {a: Number, ...} and null-prototype objects
			return
		}

		extra = {
			required: Object.create(null),
			optional: Object.create(null)
		}

		Object.keys(definition).forEach(key => {
			let info = parseKey(key),
				field = parse(definition[key])

			if (info.name in extra.optional || info.name in extra.required) {
				throw new Error('You can\'t define the same field twice: ' + key)
			}

			if (info.optional) {
				checkDefault(info.defaultSource, field)

				extra.optional[info.name] = {
					field,
					defaultSource: info.defaultSource
				}
			} else {
				extra.required[info.name] = field
			}
		})

		return extra
	}, 'object', (value, extra, options, path) => {
		let partialTree = options._partialTree,
			key, field, subPath, info

		// Check required fields
		for (key in extra.required) {
			let subPartialTree
			if (partialTree) {
				subPartialTree = partialTree[key]
				if (subPartialTree === undefined) {
					// Don't check this field
					continue
				}
				options._partialTree = subPartialTree
			}

			field = extra.required[key]
			subPath = path ? path + '.' + key : key
			if (!(key in value)) {
				throw new ValidationError('I was expecting a value', subPath)
			}
			let isEmpty = field.type.isEmpty(value[key])
			if (!isEmpty && field.preHook) {
				value[key] = field._applyPreHook(value[key])
				isEmpty = field.type.isEmpty(value[key])
			}
			if (isEmpty) {
				throw new ValidationError('I was expecting a non-empty value', subPath)
			}
			value[key] = field._validate(value[key], subPath, options, true)
		}

		// Check optional fields
		for (key in extra.optional) {
			let subPartialTree
			if (partialTree) {
				subPartialTree = partialTree[key]
				if (subPartialTree === undefined) {
					// Don't check this field
					continue
				}
				options._partialTree = subPartialTree
			}

			info = extra.optional[key]
			subPath = path ? path + '.' + key : key
			let isEmpty = info.field.type.isEmpty(value[key])
			if (!isEmpty && info.field.preHook) {
				value[key] = info.field._applyPreHook(value[key])
				isEmpty = info.field.type.isEmpty(value[key])
			}
			if (isEmpty) {
				if (info.defaultSource === undefined) {
					// No default: remove the key
					delete value[key]
				} else {
					// Set to default
					// JSON.parse won't throw because the source has already been checked
					value[key] = info.field._validate(JSON.parse(info.defaultSource), subPath, options)
				}
			} else {
				value[key] = info.field._validate(value[key], subPath, options, true)
			}
		}

		if (options.strict) {
			// Check for extraneous fields
			for (key in value) {
				subPath = path ? path + '.' + key : key
				if (value[key] === undefined) {
					delete value[key]
				} else if (!(key in extra.required) && !(key in extra.optional)) {
					throw new ValidationError('I wasn\'t expecting a value', subPath)
				} else if (partialTree && partialTree[key] === undefined) {
					throw new ValidationError('I wasn\'t expecting a value', subPath)
				}
			}

			if (partialTree) {
				// Check for extraneous fields
				for (key in partialTree) {
					subPath = path ? path + '.' + key : key
					if (!(key in extra.required) && !(key in extra.optional)) {
						throw new ValidationError('I wasn\'t expecting an unknown partial field', subPath)
					}
				}
			}
		}

		if (partialTree) {
			options._partialTree = partialTree
		}
		return value
	}, extra => {
		let ret = Object.create(null),
			key, info

		for (key in extra.required) {
			ret[key] = extra.required[key].toJSON()
		}
		for (key in extra.optional) {
			info = extra.optional[key]
			if (info.defaultSource === undefined) {
				ret[key + '?'] = info.field.toJSON()
			} else {
				ret[key + '=' + info.defaultSource] = info.field.toJSON()
			}
		}

		return ret
	}, (extra, componentsPath) => {
		let ret = {
				type: 'object',
				properties: {},
				required: []
			},
			key, info

		for (key in extra.required) {
			ret.properties[key] = extra.required[key].toJSONSchema(componentsPath, true)
			ret.required.push(key)
		}
		for (key in extra.optional) {
			info = extra.optional[key]
			ret.properties[key] = info.field.toJSONSchema(componentsPath, true)
			if (info.defaultSource !== undefined) {
				ret.properties[key].default = JSON.parse(info.defaultSource)
			}
		}

		if (!ret.required.length) {
			delete ret.required
		}

		return ret
	})
}

/**
 * @typedef {Object} KeyInfo
 * @property {string} name
 * @property {boolean} optional
 * @property {?string} defaultSource
 */

/**
 * @param {string} key
 * @returns {KeyInfo}
 */
function parseKey(key) {
	let name = key,
		optional = false,
		pos = key.indexOf('='),
		defaultSource

	if (pos !== -1) {
		// Optional with default value
		name = key.substr(0, pos)
		optional = true
		defaultSource = key.substr(pos + 1)
	} else if (key[key.length - 1] === '?') {
		// Optional without default
		name = key.substr(0, key.length - 1)
		optional = true
	}

	return {
		name,
		optional,
		defaultSource
	}
}

/**
 * @param {string} source
 * @param {Field} field
 * @throws if invalid
 */
function checkDefault(source, field) {
	let value

	if (source === undefined) {
		// No default
		return
	}

	try {
		value = JSON.parse(source)
	} catch (e) {
		throw new Error('I was expecting a valid JSON\nParse error: ' + e.message)
	}

	if (!field.validate(value)) {
		throw new Error('I was expecting a valid default value\nValidation error: ' + field.lastError)
	}
}