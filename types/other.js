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
		var flags = (extra.global ? 'g' : '') +
			(extra.ignoreCase ? 'i' : '') +
			(extra.multiline ? 'm' : '')
		return '$RegExp:' + flags + ':' + extra.source
	})
}