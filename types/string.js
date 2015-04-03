'use strict'

module.exports = function (context) {
	/**
	 * A non-empty string (unless in a hash map, marked as optional)
	 * Example: {name: {first: String, 'last?': String}}
	 * The string will be HTML escaped if options.escape is true
	 */
	context.registerType(String, 'string', function (value, _, options) {
		return options.escape ? escape(value) : value
	}, '$String')

	/**
	 * A date value in string format (like '2014-08-08T16:14:16.046Z')
	 * It will convert the string into a date object
	 * It accepts all formats defined by the Date(str) constructor, but the a ISO string is recommended
	 */
	context.registerType(Date, 'string', function (value) {
		var date = new Date(value)
		if (Number.isNaN(date.getTime())) {
			throw 'I was expecting a date string'
		}

		return date
	}, '$Date')

	/**
	 * A non-empty string with limited length
	 * Examples:
	 * 'string(12)': exactly 12 chars
	 * 'string(,100)': at most 100 chars
	 * 'string(8,)': at least 8 chars
	 * 'string(8,100)': at most 100, at least 8
	 * The string will be HTML escaped if options.escape is true
	 */
	context.registerTaggedType({
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
	context.registerTaggedType({
		tag: 'hex',
		jsonType: 'string',
		maxArgs: 1,
		numeric: true
	}, function (value, args) {
		if (!value.match(/^[0-9a-fA-F]+$/)) {
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
	context.registerType('id', 'string', function (value) {
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
	context.registerType('email', 'string', function (value) {
		// The regex forces one '@', followed by at least one '.'
		if (!value.match(/^[^@]+@.+\.[^.]+$/i)) {
			throw 'I was expecting an email address'
		}
	}, 'email')

	/**
	 * A string from the given set
	 * Example: 'in(red, green, blue)' matches 'red', 'green' and 'blue', but no other
	 */
	context.registerTaggedType({
		tag: 'in',
		jsonType: 'string'
	}, function (value, args) {
		if (args.indexOf(value) === -1) {
			throw 'I was expecting one of [' + args.join(', ') + ']'
		}
	}, function (extra) {
		return extra.original
	})
}

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