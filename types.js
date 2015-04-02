'use strict'

var register = require('./index.js').registerType,
	registerTagged = require('./index.js').registerTaggedType,
	isEmpty = require('./Type.js').isEmpty,
	ValidationError = require('./ValidationError')

/**
 * @param {string} str
 * @returns {string}
 */
function escape(str) {
	return str.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/'/g, '&#39;')
		.replace(/"/g, '&quot;')
}

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

/**
 * Arrays
 * Example: [String] or {products: [{name: String, price: Number}]}
 * An empty array will not be tolerated, unless it is inside a hash map and marked as optional
 */
register(function (definition, parse) {
	if (!Array.isArray(definition) || definition.length !== 1) {
		// Only match arrays with exactly one element
		return
	}

	return parse(definition[0])
}, 'array', function (value, extra, options, path) {
	var i, subpath
	if (value.length === 0) {
		throw 'I was expecting a non-empty array'
	}
	for (i = 0; i < value.length; i++) {
		subpath = path ? path + '.' + i : i
		value[i] = extra._validate(value[i], subpath, options)
	}
	return value
}, function (extra) {
	return [extra.toJSON()]
})

/**
 * A number (double)
 * Example: {name: String, value: Number}
 */
register(Number, 'number', null, '$Number')

/**
 * A non-empty string (unless in a hash map, marked as optional)
 * Example: {name: {first: String, 'last?': String}}
 * The string will be HTML escaped if options.escape is true
 */
register(String, 'string', function (value, _, options) {
	if (value.length === 0) {
		throw 'I was expecting a non-empty string'
	}
	return options.escape ? escape(value) : value
}, '$String')

/**
 * A non-null generic object. No property is validated inside the object
 * Example: {date: Date, event: Object}
 */
register(Object, 'object', function (value) {
	if (value === null) {
		throw 'I was expecting a non-null object'
	}
}, '$Object')

/**
 * A non-empty generic array. No element is validated inside the array
 * Example: {arrayOfThings: Array}
 */
register(Array, 'array', function (value) {
	if (value.length === 0) {
		throw 'I was expecting a non-empty array'
	}
}, '$Array')

/** A bool value */
register(Boolean, 'boolean', null, '$Boolean')

/**
 * A date value in string format (like '2014-08-08T16:14:16.046Z')
 * It will convert the string into a date object
 * It accepts all formats defined by the Date(str) constructor, but the a ISO string is recommended
 */
register(Date, 'string', function (value) {
	var date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		throw 'I was expecting a date string'
	}

	return date
}, '$Date')

/**
 * Any type
 */
register('*', '*', null, '*')

/**
 * A number range
 * Examples:
 * 'number(1,)'
 * 'number(,10)'
 * 'number(1,10)'
 */
registerTagged({
	tag: 'number',
	jsonType: 'number',
	minArgs: 2,
	maxArgs: 2,
	sparse: true,
	numeric: true
}, function (value, args) {
	if (args[0] !== undefined && value < args[0]) {
		throw 'I was expecting a value greater than ' + args[0]
	} else if (args[1] !== undefined && value > args[1]) {
		throw 'I was expecting a value less than ' + args[0]
	}
}, function (extra) {
	return extra.original
})

/**
 * A safe integer
 */
register('int', 'number', function (value) {
	if (!isSafeInt(value)) {
		throw 'I was expecting an integer'
	}
}, 'int')

/**
 * An integer range
 * Examples:
 * 'int(1,)'
 * 'int(,10)'
 * 'int(1,10)'
 */
registerTagged({
	tag: 'int',
	jsonType: 'number',
	minArgs: 2,
	maxArgs: 2,
	sparse: true,
	numeric: true
}, function (value, args) {
	if (!isSafeInt(value)) {
		throw 'I was expecting an integer'
	}

	if (args[0] !== undefined && value < args[0]) {
		throw 'I was expecting a value greater than ' + args[0]
	} else if (args[1] !== undefined && value > args[1]) {
		throw 'I was expecting a value less than ' + args[0]
	}
}, function (extra) {
	return extra.original
})

/**
 * A safe natural number
 */
register('uint', 'number', function (value) {
	if (!isSafeInt(value) || value < 0) {
		throw 'I was expecting a natural number'
	}
}, 'uint')

/**
 * An unsigned integer range
 * Examples:
 * 'uint(1,)'
 * 'uint(,10)'
 * 'uint(1,10)'
 */
registerTagged({
	tag: 'uint',
	jsonType: 'number',
	minArgs: 2,
	maxArgs: 2,
	sparse: true,
	numeric: true
}, function (value, args) {
	if (!isSafeInt(value) || value < 0) {
		throw 'I was expecting a natural number'
	}

	if (args[0] !== undefined && value < args[0]) {
		throw 'I was expecting a value greater than ' + args[0]
	} else if (args[1] !== undefined && value > args[1]) {
		throw 'I was expecting a value less than ' + args[0]
	}
}, function (extra) {
	return extra.original
})

/**
 * A non-empty string with limited length
 * Examples:
 * 'string(12)': exactly 12 chars
 * 'string(,100)': at most 100 chars
 * 'string(8,)': at least 8 chars
 * 'string(8,100)': at most 100, at least 8
 * The string will be HTML escaped if options.escape is true
 */
registerTagged({
	tag: 'string',
	jsonType: 'string',
	minArgs: 1,
	maxArgs: 2,
	sparse: true,
	numeric: true
}, function (value, args, options) {
	if (options.escape) {
		value = escape(value)
	}
	if (value.length === 0) {
		throw 'I was expecting a non-empty string'
	}

	if (args.length === 1) {
		// Exact length
		if (value.length !== args[0]) {
			throw 'I was expecting exactly ' + args[0] + ' chars'
		}
	} else {
		// Min/max length
		if (args[0] !== undefined && value.length < args[0]) {
			throw 'I was expecting at least ' + args[0] + ' chars'
		} else if (args[1] !== undefined && value.length > args[1]) {
			throw 'I was expecting at most ' + args[1] + ' chars'
		}
	}

	return value
}, function (extra) {
	return extra.original
})

/**
 * A non-empty hex-encoded string
 * Examples:
 * 'hex': a non-empty hex string
 * 'hex(12)': a hex-string with exactly 12 hex-chars (that is, 6 bytes)
 */
registerTagged({
	tag: 'hex',
	jsonType: 'string',
	maxArgs: 1,
	numeric: true
}, function (value, args) {
	if (value.length === 0) {
		throw 'I was expecting a non-empty string'
	} else if (!value.match(/^[0-9a-fA-F]+$/)) {
		throw 'I was expecting a hex-encoded string'
	} else if (args.length && value.length !== args[0]) {
		throw 'I was expecting a string with ' + args[0] + ' hex-chars'
	}
}, function (extra) {
	return extra.original
})

/**
 * A mongo objectId as a 24-hex-char string
 */
register('id', 'string', function (value) {
	if (!value.match(/^[0-9a-fA-F]{24}$/)) {
		throw 'I was expecting a mongo objectId'
	}
}, 'id')

/**
 * An email
 * Note: this regex isn't much strict on purpose, since:
 * 1) There is no complete regex that matches exactly the spec
 * 2) The right way to check if a email is valid is trying to send an message to it!
 *    (even this is broken: it's easy to get a temporary trash mailbox)
 */
register('email', 'string', function (value) {
	// The regex forces one '@', followed by at least one '.'
	if (!value.match(/^[^@]+@.+\.[^.]+$/i)) {
		throw 'I was expecting an email address'
	}
}, 'email')

/**
 * A string from the given set
 * Example: 'in(red, green, blue)' matches 'red', 'green' and 'blue', but no other
 */
registerTagged({
	tag: 'in',
	jsonType: 'string'
}, function (value, args) {
	if (args.indexOf(value) === -1) {
		throw 'I was expecting one of [' + args.join(', ') + ']'
	}
}, function (extra) {
	return extra.original
})

/**
 * A number from the given set
 * Example: 'numberIn(3, 14, 15)' matches 3, 14, 15, but no other
 */
registerTagged({
	tag: 'numberIn',
	jsonType: 'number',
	numeric: true
}, function (value, args) {
	if (args.indexOf(value) === -1) {
		throw 'I was expecting one of [' + args.join(', ') + ']'
	}
}, function (extra) {
	return extra.original
})

/**
 * A string that matches a custom regex
 * Example: /^\d+\.\d{2}$/ matches '3.14'
 */
register(function (definition) {
	if (definition instanceof RegExp) {
		return definition
	}
}, 'string', function (value, extra) {
	if (!value.match(extra)) {
		throw 'I was expecting a string that matches ' + extra
	}
}, function (extra) {
	var flags = (extra.global ? 'g' : '') +
		(extra.ignoreCase ? 'i' : '') +
		(extra.multiline ? 'm' : '')
	return '$RegExp:' + flags + ':' + extra.source
})

function isSafeInt(value) {
	return Number.isFinite(value) &&
		value > -9007199254740992 &&
		value < 9007199254740992 &&
		Math.round(value) === value
}