'use strict'

var register = require('../').registerType,
	registerTagged = require('../').registerTaggedType

/**
 * A number (double)
 * Example: {name: String, value: Number}
 */
register(Number, 'number', null, '$Number')

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
 * @param {number} value
 * @returns {boolean}
 */
function isSafeInt(value) {
	return Number.isFinite(value) &&
		value > -9007199254740992 &&
		value < 9007199254740992 &&
		Math.round(value) === value
}