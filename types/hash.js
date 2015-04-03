'use strict'

var register = require('../').registerType,
	isEmpty = require('../Type').isEmpty,
	ValidationError = require('../ValidationError')

/**
 * Hash maps
 * Example: {name: String, age: Number, dates: {birth: Date, 'death?': Date}}
 * If the key name ends with '?' that field is optional
 * After validation, a field will never be empty (like '' or []). If it's marked as optional, it will be either non-empty or not-present ('key' in obj === false)
 *
 * If options.strict is set, extraneous fields will be considered as invalid.
 * Example: validate({}, {a: 2}, {strict: true}) // false: I wasn't expecting a value in a
 */
register(function (definition, parse) {
	var extra

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

	Object.keys(definition).forEach(function (key) {
		var info = parseKey(key),
			field = parse(definition[key])

		if (info.name in extra.optional || info.name in extra.required) {
			throw new Error('You can\'t define the same field twice: ' + key)
		}

		if (info.optional) {
			checkDefault(info.defaultSource, field)

			extra.optional[info.name] = {
				field: field,
				defaultSource: info.defaultSource
			}
		} else {
			extra.required[info.name] = field
		}
	})

	return extra
}, 'object', function (value, extra, options, path) {
	var key, field, subpath, info

	// Check required fields
	for (key in extra.required) {
		field = extra.required[key]
		subpath = path ? path + '.' + key : key
		if (!(key in value)) {
			throw new ValidationError('I was expecting a value', subpath)
		} else if (isEmpty(value[key])) {
			throw new ValidationError('I was expecting a non-empty value', subpath)
		}
		value[key] = field._validate(value[key], subpath, options)
	}

	// Check optional fields
	for (key in extra.optional) {
		info = extra.optional[key]
		subpath = path ? path + '.' + key : key
		if (isEmpty(value[key])) {
			if (info.defaultSource === undefined) {
				// No default: remove the key
				delete value[key]
			} else {
				// Set to default
				// JSON.parse won't throw because the source has already been checked
				value[key] = JSON.parse(info.defaultSource)
			}
		} else {
			value[key] = info.field._validate(value[key], subpath, options)
		}
	}

	if (options.strict) {
		// Check for extraneous fields
		for (key in value) {
			subpath = path ? path + '.' + key : key
			if (!(key in extra.required) && !(key in extra.optional)) {
				throw new ValidationError('I wasn\'t expecting a value', subpath)
			}
		}
	}

	return value
}, function (extra) {
	var ret = Object.create(null),
		key, info

	for (key in extra.required) {
		ret[key] = extra.required[key].toJSON()
	}
	for (key in extra.optional) {
		info = extra.optional[key]
		if (info.defaultSource === undefined) {
			ret[key + '?'] = info.field.toJSON()
		} else {
			ret[key + '=' + JSON.stringify(info.defaultSource)] = info.field.toJSON()
		}
	}

	return ret
})

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
	var name = key,
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
		name: name,
		optional: optional,
		defaultSource: defaultSource
	}
}

/**
 * @param {string} source
 * @param {Field} field
 * @throws if invalid
 */
function checkDefault(source, field) {
	var value

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