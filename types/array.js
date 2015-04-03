'use strict'

var register = require('../').registerType

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
	for (i = 0; i < value.length; i++) {
		subpath = path ? path + '.' + i : i
		value[i] = extra._validate(value[i], subpath, options)
	}
	return value
}, function (extra) {
	return [extra.toJSON()]
})