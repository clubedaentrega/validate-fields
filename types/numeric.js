'use strict'

module.exports = function (context) {
	/**
	 * A number (double)
	 * Example: {name: String, value: Number}
	 */
	context.registerType(Number, 'number', null, '$Number')

	/**
	 * A double value encoded in a string
	 */
	context.registerType('numeric', 'string', function (value) {
		return toNumber(value)
	}, 'numeric')

	/**
	 * A number range
	 * Examples:
	 * 'number(1,)'
	 * 'number(,10)'
	 * 'number(1,10)'
	 * 'numeric(1,)'
	 * 'numeric(,10)'
	 * 'numeric(1,10)'
	 */
	registerTaggedDual('number', 'numeric', function (value, args) {
		if (args[0] !== undefined && value < args[0]) {
			throw 'I was expecting a value greater than ' + args[0]
		} else if (args[1] !== undefined && value > args[1]) {
			throw 'I was expecting a value less than ' + args[1]
		}
	})

	/**
	 * A safe integer
	 */
	registerDual('int', 'numericInt', function (value) {
		if (!isSafeInt(value)) {
			throw 'I was expecting an integer'
		}
	})

	/**
	 * An integer range
	 * Examples:
	 * 'int(1,)'
	 * 'int(,10)'
	 * 'int(1,10)'
	 * 'numericInt(1,)'
	 * 'numericInt(,10)'
	 * 'numericInt(1,10)'
	 */
	registerTaggedDual('int', 'numericInt', function (value, args) {
		if (!isSafeInt(value)) {
			throw 'I was expecting an integer'
		}

		if (args[0] !== undefined && value < args[0]) {
			throw 'I was expecting a value greater than ' + args[0]
		} else if (args[1] !== undefined && value > args[1]) {
			throw 'I was expecting a value less than ' + args[1]
		}
	})

	/**
	 * A safe natural number
	 */
	registerDual('uint', 'numericUint', function (value) {
		if (!isSafeInt(value) || value < 0) {
			throw 'I was expecting a natural number'
		}
	})

	/**
	 * An unsigned integer range
	 * Examples:
	 * 'uint(1,)'
	 * 'uint(,10)'
	 * 'uint(1,10)'
	 * 'numericUint(1,)'
	 * 'numericUint(,10)'
	 * 'numericUint(1,10)'
	 */
	registerTaggedDual('uint', 'numericUint', function (value, args) {
		if (!isSafeInt(value) || value < 0) {
			throw 'I was expecting a natural number'
		}

		if (args[0] !== undefined && value < args[0]) {
			throw 'I was expecting a value greater than ' + args[0]
		} else if (args[1] !== undefined && value > args[1]) {
			throw 'I was expecting a value less than ' + args[1]
		}
	})

	/**
	 * A number from the given set
	 * Example: 'numberIn(3, 14, 15)' matches 3, 14, 15, but no other
	 */
	context.registerTaggedType({
		tag: 'numberIn',
		jsonType: 'number',
		numeric: true
	}, function (value, args) {
		if (args.indexOf(value) === -1) {
			throw 'I was expecting one of [' + args.join(', ') + ']'
		}
	}, returnOriginal)
	context.registerTaggedType({
		tag: 'numericIn',
		jsonType: 'string',
		numeric: true
	}, function (value, args) {
		var numberValue = toNumber(value)
		if (args.indexOf(numberValue) === -1) {
			throw 'I was expecting one of [' + args.join(', ') + ']'
		}
		return numberValue
	}, returnOriginal)

	/**
	 * Register number and numeric dual basic types
	 * @param {string} numberType
	 * @param {string} numericType
	 * @param {Function} checkFn
	 * @private
	 */
	function registerDual(numberType, numericType, checkFn) {
		context.registerType(numberType, 'number', checkFn, numberType)

		context.registerType(numericType, 'string', function (value) {
			var numberValue = toNumber(value)
			checkFn(numberValue)
			return numberValue
		}, numericType)
	}

	/**
	 * Register number and numeric dual tagged types
	 * @param {string} numberTag
	 * @param {string} numericTag
	 * @param {Function} checkFn
	 * @private
	 */
	function registerTaggedDual(numberTag, numericTag, checkFn) {
		context.registerTaggedType({
			tag: numberTag,
			jsonType: 'number',
			minArgs: 2,
			maxArgs: 2,
			sparse: true,
			numeric: true
		}, checkFn, returnOriginal)

		context.registerTaggedType({
			tag: numericTag,
			jsonType: 'string',
			minArgs: 2,
			maxArgs: 2,
			sparse: true,
			numeric: true
		}, function (value, args) {
			var numberValue = toNumber(value)
			checkFn(numberValue, args)
			return numberValue
		}, returnOriginal)
	}

	/**
	 * Standard toJSON callback
	 */
	function returnOriginal(extra) {
		return extra.original
	}
}

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

/**
 * @param {string} value
 * @returns {number}
 * @throws if invalid
 */
function toNumber(value) {
	var numberValue = Number(value),
		type
	if (Number.isNaN(numberValue)) {
		type = 'NaN'
	} else if (numberValue === Infinity || numberValue === -Infinity) {
		type = 'infinity'
	} else {
		type = typeof numberValue
	}
	if (type !== 'number') {
		throw 'I was expecting number and you gave me ' + type
	}
	return numberValue
}