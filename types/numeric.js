'use strict'

module.exports = function (context) {
	/**
	 * A number (double)
	 * Example: {name: String, value: Number}
	 */
	context.registerType(Number, 'number', null, '$Number', function () {
		return {
			type: 'number'
		}
	})

	/**
	 * A double value encoded in a string
	 */
	context.registerType('numeric', 'string', function (value) {
		return toNumber(value)
	}, 'numeric', function () {
		return {
			type: 'string',
			format: 'numeric'
		}
	})

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
	}, function (args) {
		return buildSchema('number', args[0], args[1])
	})

	/**
	 * A safe integer
	 */
	registerDual('int', 'numericInt', function (value) {
		if (!isSafeInt(value)) {
			throw 'I was expecting an integer'
		}
	}, function () {
		return buildSchema('integer')
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
	}, function (args) {
		return buildSchema('integer', args[0], args[1])
	})

	/**
	 * A safe natural number
	 */
	registerDual('uint', 'numericUint', function (value) {
		if (!isSafeInt(value) || value < 0) {
			throw 'I was expecting a natural number'
		}
	}, function () {
		return buildSchema('integer', 0)
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
	}, function (args) {
		return buildSchema('integer', Math.max(args[0] || 0, 0), args[1])
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
	}, returnOriginal, function (args) {
		return {
			type: 'number',
			enum: args
		}
	})
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
	}, returnOriginal, function (args) {
		return {
			type: 'number',
			enum: args.map(function (arg) {
				return String(arg)
			})
		}
	})

	/**
	 * Register number and numeric dual basic types
	 * @param {string} numberType
	 * @param {string} numericType
	 * @param {Function} checkFn
	 * @param {function(string, *):Object} toJSONSchema
	 * @private
	 */
	function registerDual(numberType, numericType, checkFn, toJSONSchema) {
		context.registerType(numberType, 'number', checkFn, numberType, function (extra) {
			return toJSONSchema('number', extra)
		})

		context.registerType(numericType, 'string', function (value) {
			var numberValue = toNumber(value)
			checkFn(numberValue)
			return numberValue
		}, numericType, function () {
			return {
				type: 'string',
				format: numericType
			}
		})
	}

	/**
	 * Register number and numeric dual tagged types
	 * @param {string} numberTag
	 * @param {string} numericTag
	 * @param {Function} checkFn
	 * @param {function(*):Object} toJSONSchema
	 * @private
	 */
	function registerTaggedDual(numberTag, numericTag, checkFn, toJSONSchema) {
		context.registerTaggedType({
			tag: numberTag,
			jsonType: 'number',
			minArgs: 2,
			maxArgs: 2,
			sparse: true,
			numeric: true
		}, checkFn, returnOriginal, toJSONSchema)

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
		}, returnOriginal, function (extra) {
			return {
				type: 'string',
				format: extra.original
			}
		})
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
	if (isNaN(numberValue)) {
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

/**
 * @param {string} type
 * @param {number} [min]
 * @param {number} [max]
 */
function buildSchema(type, min, max) {
	var ret = {
		type: type
	}

	if (min !== undefined) {
		ret.minimum = min
	}
	if (max !== undefined) {
		ret.maximum = max
	}

	return ret
}