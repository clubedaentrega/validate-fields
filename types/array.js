'use strict'

module.exports = function (context) {
	/**
	 * Arrays
	 * Example: [String] or {products: [{name: String, price: Number}]}
	 * An empty array will not be tolerated, unless it is inside a hash map and marked as optional
	 */
	context.registerType((definition, parse) => {
		if (!Array.isArray(definition) || definition.length !== 1) {
			// Only match arrays with exactly one element
			return
		}

		return parse(definition[0])
	}, 'array', (value, extra, options, path) => {
		let i, subpath
		for (i = 0; i < value.length; i++) {
			subpath = path ? path + '.' + i : i
			value[i] = extra._validate(value[i], subpath, options)
		}
		return value
	}, extra => [extra.toJSON()], (extra, expandTypedefs) => ({
			type: 'array',
			items: extra.toJSONSchema(expandTypedefs)
		}))
}