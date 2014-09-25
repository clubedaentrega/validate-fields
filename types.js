'use strict'

var register = require('./index.js').registerType,
	isEmpty = require('./Type.js').isEmpty

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
}, 'object', function (value, path, extra, options) {
	var key, field, subpath

	// Check required fields
	for (key in extra.required) {
		field = extra.required[key]
		subpath = path ? path + '.' + key : key
		if (!(key in value)) {
			throw new Error('I was expecting a value in ' + subpath)
		} else if (isEmpty(value[key])) {
			throw new Error('I was expecting a non-empty value in ' + subpath)
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

	return value
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
}, 'array', function (value, path, extra, options) {
	var i, subpath
	if (value.length === 0) {
		throw new Error('I was expecting a non-empty array in ' + path)
	}
	for (i = 0; i < value.length; i++) {
		subpath = path ? path + '.' + i : i
		value[i] = extra._validate(value[i], subpath, options)
	}
	return value
})

/**
 * A number (double)
 * Example: {name: String, value: Number}
 */
register(Number, 'number')

/**
 * A non-empty string (unless in a hash map, marked as optional)
 * Example: {name: {first: String, 'last?': String}}
 * The string will be HTML escaped if options.escape is true
 */
register(String, 'string', function (value, path, _, options) {
	if (value.length === 0) {
		throw new Error('I was expecting a non-empty string in ' + path)
	}
	return options.escape ? escape(value) : value
})

/**
 * A non-null generic object. No property is validated inside the object
 * Example: {date: Date, event: Object}
 */
register(Object, 'object', function (value, path) {
	if (value === null) {
		throw new Error('I was expecting a non-null object in ' + path)
	}
})

/**
 * A non-empty generic array. No element is validated inside the array
 * Example: {arrayOfThings: Array}
 */
register(Array, 'array', function (value, path) {
	if (value.length === 0) {
		throw new Error('I was expecting a non-empty array in ' + path)
	}
})

/** A bool value */
register(Boolean, 'boolean')

/**
 * A date value in string format (like '2014-08-08T16:14:16.046Z')
 * It will convert the string into a date object
 * It accepts all formats defined by the Date(str) constructor, but the a ISO string is recommended
 */
register(Date, 'string', function (value, path) {
	var date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		throw new Error('I was expecting a date string in ' + path)
	}

	return date
})

/**
 * A safe integer
 */
register('int', 'number', function (value, path) {
	if (!Number.isFinite(value) ||
		value <= -9007199254740992 ||
		value >= 9007199254740992 ||
		Math.floor(value) !== value) {
		throw new Error('I was expecting a integer in ' + path)
	}
})

/**
 * A safe natural number
 */
register('uint', 'number', function (value, path) {
	if (!Number.isFinite(value) ||
		value < 0 ||
		value >= 9007199254740992 ||
		Math.floor(value) !== value) {
		throw new Error('I was expecting a natural number in ' + path)
	}
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
register(/^string\((?:(\d+)|(\d+)?,(\d+)?)\)$/, 'string', function (value, path, extra, options) {
	if (options.escape) {
		value = escape(value)
	}
	if (value.length === 0) {
		throw new Error('I was expecting a non-empty string in ' + path)
	}

	if (extra[1]) {
		// Exact length
		if (value.length !== Number(extra[1])) {
			throw new Error('I was expecting exactly ' + extra[1] + ' chars in ' + path)
		}
	} else {
		// Min/max length
		if (extra[2] && value.length < Number(extra[2])) {
			throw new Error('I was expecting at least ' + extra[2] + ' chars in ' + path)
		} else if (extra[3] && value.length > Number(extra[3])) {
			throw new Error('I was expecting at most ' + extra[3] + ' chars in ' + path)
		}
	}

	return value
})

/**
 * A non-empty hex-encoded string
 * Examples:
 * 'hex': a non-empty hex string
 * 'hex(12)': a hex-string with exactly 12 hex-chars (that is, 6 bytes)
 */
register(/^hex(\((\d+)\))?$/, 'string', function (value, path, extra) {
	if (value.length === 0) {
		throw new Error('I was expecting a non-empty string in ' + path)
	} else if (!value.match(/^[0-9a-fA-F]+$/)) {
		throw new Error('I was expecting a hex-encoded string in ' + path)
	} else if (extra[2] && value.length !== Number(extra[2])) {
		throw new Error('I was expecting a string with ' + extra[2] + ' hex-chars in ' + path)
	}
})

/**
 * A mongo objectId as a 24-hex-char string
 */
register('id', 'string', function (value, path) {
	if (!value.match(/^[0-9a-fA-F]{24}$/)) {
		throw new Error('I was expecting a mongo objectId in ' + path)
	}
})

/**
 * An email
 * Note: this regex isn't much strict on purpose:
 * 1) There is no complete regex that matches exactly the spec
 * 2) The right way to check if a email is valid is trying to send an message to it!
 *    (even this is broken: it's easy to get a temporary trash mailbox)
 */
register('email', 'string', function (value, path) {
	// The regex forces one '@', followed by at least one '.'
	if (!value.match(/^[^@]+@.+\.[^.]+$/i)) {
		throw new Error('I was expecting an email address in ' + path)
	}
})

/**
 * A string from the given set
 * Example: 'in(red, green, blue)' matches 'red', 'green' and 'blue', but no other
 */
register(function (definition) {
	if (typeof definition !== 'string') {
		return
	} else if (definition.substr(0, 3) !== 'in(' || definition.substr(-1) !== ')') {
		return
	}
	return definition.substring(3, definition.length - 1).trim().split(/\s*,\s*/)
}, 'string', function (value, path, extra) {
	if (extra.indexOf(value) === -1) {
		throw new Error('I was expecting one of [' + extra.join(', ') + '] in ' + path)
	}
})

/**
 * A string that matches a custom regex
 * Example: /^\d+\.\d{2}$/ matches '3.14'
 */
register(function (definition) {
	if (definition instanceof RegExp) {
		return definition
	}
}, 'string', function (value, path, extra) {
	if (!value.match(extra)) {
		throw new Error('I was expecting a string that matches ' + extra + ' in ' + path)
	}
})