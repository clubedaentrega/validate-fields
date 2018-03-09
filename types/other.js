'use strict'

module.exports = function (context) {
	/**
	 * A non-null generic object. No property is validated inside the object
	 * Example: {date: Date, event: Object}
	 */
	context.registerObjectType(Object, 'object', value => {
		if (value === null) {
			throw 'I was expecting a non-null object'
		}
	}, '$Object')

	/**
	 * A non-empty generic array. No element is validated inside the array
	 * Example: {arrayOfThings: Array}
	 */
	context.registerObjectType(Array, 'array', null, '$Array')

	/** A bool value */
	context.registerObjectType(Boolean, 'boolean', null, '$Boolean')

	/**
	 * Any type
	 */
	context.registerType('*', '*', null, '*')

	/**
	 * A string that matches a custom regex
	 * Example: /^\d+\.\d{2}$/ matches '3.14'
	 */
	context.registerType(definition => {
		if (definition instanceof RegExp) {
			return definition
		}
	}, 'string', (value, extra) => {
		if (!value.match(extra)) {
			throw 'I was expecting a string that matches ' + extra
		}
	}, extra => '$RegExp:' + prepareFlags(extra) + ':' + extra.source, extra => {
		let flags = prepareFlags(extra),
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