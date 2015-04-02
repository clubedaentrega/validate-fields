'use strict'

var register = require('../').registerType

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
 * Any type
 */
register('*', '*', null, '*')

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