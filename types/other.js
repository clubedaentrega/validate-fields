'use strict'

module.exports = function (context) {
	/**
	 * A non-null generic object. No property is validated inside the object
	 * Example: {date: Date, event: Object}
	 */
	context.registerType(Object, 'object', function (value) {
		if (value === null) {
			throw 'I was expecting a non-null object'
		}
	}, '$Object')

	/**
	 * A non-empty generic array. No element is validated inside the array
	 * Example: {arrayOfThings: Array}
	 */
	context.registerType(Array, 'array', null, '$Array')

	/** A bool value */
	context.registerType(Boolean, 'boolean', null, '$Boolean')

	/**
	 * Any type
	 */
	context.registerType('*', '*', null, '*')

	/**
	 * A string that matches a custom regex
	 * Example: /^\d+\.\d{2}$/ matches '3.14'
	 */
	context.registerType(function (definition) {
		if (definition instanceof RegExp) {
			return definition
		}
	}, 'string', function (value, extra) {
		if (!value.match(extra)) {
			throw 'I was expecting a string that matches ' + extra
		}
	}, function (extra) {
		return '$RegExp:' + prepareFlags(extra) + ':' + extra.source
	}, function (extra) {
		var flags = prepareFlags(extra),
			ret = {
				type: 'string',
				pattern: extra.source
			}

		if (flags) {
			ret['x-flags'] = flags
		}

		return ret
	})
}

/**
 * @param {RegExp} regex
 * @returns {string}
 */
function prepareFlags(regex) {
	return (regex.global ? 'g' : '') +
		(regex.ignoreCase ? 'i' : '') +
		(regex.multiline ? 'm' : '') +
		(regex.unicode ? 'u' : '') +
		(regex.sticky ? 'y' : '')
}