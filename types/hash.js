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
		var optional = key[key.length - 1] === '?',
			newKey = optional ? key.substr(0, key.length - 1) : key,
			field = parse(definition[key])

		if (newKey in extra.optional || newKey in extra.required) {
			throw new Error('You can\'t define the same field twice: ' + key)
		}

		if (optional) {
			extra.optional[newKey] = field
		} else {
			extra.required[newKey] = field
		}
	})

	return extra
}, 'object', function (value, extra, options, path) {
	var key, field, subpath

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
		field = extra.optional[key]
		subpath = path ? path + '.' + key : key
		if (key in value) {
			if (isEmpty(value[key])) {
				delete value[key]
			} else {
				value[key] = field._validate(value[key], subpath, options)
			}
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
	var key, ret = Object.create(null)

	for (key in extra.required) {
		ret[key] = extra.required[key].toJSON()
	}
	for (key in extra.optional) {
		ret[key + '?'] = extra.optional[key].toJSON()
	}

	return ret
})