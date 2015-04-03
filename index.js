'use strict'

var Field = require('./Field.js'),
	Type = require('./Type.js')

module.exports = function () {
	/** Store types defined by a string */
	var simpleTypes = Object.create(null)

	/** Store types defined in terms of other ones */
	var typedefs = Object.create(null)

	/** Store types defined by an object */
	var objectTypes = {
		objects: [],
		types: []
	}

	/** Store types defined by a callback */
	var callbackTypes = {
		fns: [],
		types: []
	}

	/** Store types defined by tags */
	var taggedTypes = Object.create(null)

	/**
	 * Validate the given value against the given schema
	 * @param {*} schema
	 * @param {*} value The value can be altered by the validation
	 * @param {Object} [options] Validation options
	 * @returns {boolean} whether the value is valid or nor
	 * @throw if the schema is invalid
	 */
	var context = function (schema, value, options) {
		schema = context.parse(schema)
		var ret = schema.validate(value, options)
		context.lastError = schema.lastError
		context.lastErrorMessage = schema.lastErrorMessage
		context.lastErrorPath = schema.lastErrorPath
		return ret
	}

	/**
	 * Store the last error message
	 * @property {string}
	 */
	context.lastError = ''

	/**
	 * Parse the given fields definition
	 * @param {Object} fields
	 * @returns {Field} The parsed object that can be used with validate()
	 * @throw if the definition is invalid
	 */
	context.parse = function (fields) {
		var pos, i, extra, field

		if (typeof fields === 'string' && fields in simpleTypes) {
			// Type defined by a string
			return new Field(simpleTypes[fields])
		} else if (typeof fields === 'string' && fields in typedefs) {
			// Type defined by a string
			return typedefs[fields]
		} else if ((pos = objectTypes.objects.indexOf(fields)) !== -1) {
			// Type defined by an object
			return new Field(objectTypes.types[pos])
		} else if (typeof fields === 'string' && (field = parseTagged(fields, taggedTypes))) {
			return field
		} else {
			// Search by a type, executing the callbacks
			for (i = 0; i < callbackTypes.fns.length; i++) {
				extra = callbackTypes.fns[i](fields, context.parse)
				if (extra !== undefined) {
					return new Field(callbackTypes.types[i], extra)
				}
			}

			// Nothing found
			throw new Error('I couldn\'t understand field definition: ' + fields)
		}
	}

	/**
	 * Define a new simple type based on existing types
	 * @param {string} name
	 * @param {*} definition
	 * @throws if definition could not be understood or this type already exists
	 */
	context.typedef = function (name, definition) {
		if (typeof name !== 'string') {
			throw new Error('Invalid argument type for name, it must be a string')
		}
		definition = context.parse(definition)
		if (name in simpleTypes || name in typedefs) {
			throw new Error('Type ' + name + ' already registered')
		}
		typedefs[name] = definition
	}

	/**
	 * @callback parseCallback
	 * @param {*} definition the value being parsed
	 * @param {function} parse the root parse function, used to create recursive definitions
	 * @returns {*} undefined if the definition could not be parsed or a value (any other) to indicate the definition was parsed. The returned value will be sent to checkCallback afterwards
	 */

	/**
	 * @callback checkCallback
	 * @param {*} value the value to check
	 * @param {*} extra the result of String.prototype.match if the type is defined with a regexp or the parseCallback result if defined with a function
	 * @param {Object} options
	 * @param {string} path a string used in the error message
	 * @returns {*} optionally return the altered value
	 * @throws {string} if the value is invalid, the message will be put in the lastError property of the validation schema
	 */

	/**
	 * @callback toJSONCallback
	 * @param {*} extra
	 * @returns {*}
	 */

	/**
	 * Register a new type
	 * @param {(string|Object|RegExp|parseCallback)} definition
	 * @param {string} jsonType One of 'number', 'string', 'boolean', 'object' or 'array'
	 * @param {checkCallback} [checkFn=function(){}]
	 * @param {toJSONCallback|string} [toJSON] - Used only by core types
	 */
	context.registerType = function (definition, jsonType, checkFn, toJSON) {
		var type = new Type(jsonType, checkFn || function () {}, toJSON)
		if (typeof definition === 'string') {
			// Simple definition: match a single string
			if (definition in simpleTypes || definition in typedefs) {
				throw new Error('Type ' + definition + ' already registered')
			}
			simpleTypes[definition] = type
		} else if (definition instanceof RegExp) {
			// Defined by a RegExp: create a callback
			callbackTypes.fns.push(function (def2) {
				var match
				if (typeof def2 === 'string' && (match = def2.match(definition))) {
					return match
				}
			})
			callbackTypes.types.push(type)
		} else if (typeof definition === 'object' ||
			(typeof definition === 'function' &&
				typeof definition.name === 'string' &&
				definition.name.match(/^[A-Z]/))) {
			// Defined by an Object or a constructor
			if (objectTypes.objects.indexOf(definition) !== -1) {
				throw new Error('Type ' + definition + ' already registered')
			}
			objectTypes.objects.push(definition)
			objectTypes.types.push(type)
		} else if (typeof definition === 'function') {
			// Defined by a callback
			if (callbackTypes.fns.indexOf(definition) !== -1) {
				throw new Error('Type ' + definition + ' already registered')
			}
			callbackTypes.fns.push(definition)
			callbackTypes.types.push(type)
		} else {
			throw new Error('Invalid definition (' + definition + '), it must be a string, object, regexp or function')
		}
	}

	/**
	 * Register a new tagged type
	 * @param {Object} definition
	 * @param {string} definition.tag
	 * @param {string} definition.jsonType One of 'number', 'string', 'boolean', 'object' or 'array'
	 * @parma {number} [definition.minArgs=0]
	 * @parma {number} [definition.maxArgs=0] Zero means no limit
	 * @parma {boolean} [definition.sparse=false] true let some args to be skipped: 'tag(,2,,4)'
	 * @parma {boolean} [definition.numeric=false] true will parse all args as numbers
	 * @param {checkCallback} [checkFn=function(){}]
	 * @param {toJSONCallback|string} [toJSON] - Used only by core types
	 */
	context.registerTaggedType = function (definition, checkFn, toJSON) {
		if (!definition || typeof definition !== 'object') {
			throw new Error('Invalid definition (' + definition + '), it must be an object')
		} else if (!definition.tag || !definition.jsonType) {
			throw new Error('definition.tag and definition.jsonType are required')
		}

		var tag = definition.tag,
			type = new Type(definition.jsonType, checkFn || function () {}, toJSON)

		if (tag in taggedTypes) {
			throw new Error('Tag ' + tag + ' already registered')
		}

		taggedTypes[tag] = {
			type: type,
			minArgs: definition.minArgs || 0,
			maxArgs: definition.maxArgs || 0,
			sparse: Boolean(definition.sparse),
			numeric: Boolean(definition.numeric)
		}
	}

	/**
	 * Return a reference to all registered types
	 * You can change it to alter the very inner working of this module
	 * The two main types are:
	 * * Hash map: callbackTypes.fns[0], callbackTypes.types[0]
	 * * Array: callbackTypes.fns[1], callbackTypes.types[1]
	 * @returns {{simpleTypes: Object.<string, Type>, typedefs: Field, objectTypes: {objects: Object[], types: Type[]}, callbackTypes: {fns: Function[], types: Type[]}}, taggedTypes: Object<string, {type: string, minArgs: number, maxArgs: number, sparse: boolean, numeric: boolean}>}
	 */
	context.getRegisteredTypes = function () {
		return {
			simpleTypes: simpleTypes,
			typedefs: typedefs,
			objectTypes: objectTypes,
			callbackTypes: callbackTypes,
			taggedTypes: taggedTypes
		}
	}

	// Static link to global reviver
	context.reviver = module.exports.reviver

	// Register standard types
	require('./types')(context)

	return context
}

/**
 * Try to parse a string definition as a tagged type
 * @private
 * @param {string} definition
 * @param {Object<String, Object>} taggedTypes
 * @returns {?Field}
 */
function parseTagged(definition, taggedTypes) {
	var match = definition.match(/^(\w+)(?:\((.*)\))?$/),
		tag, args, typeInfo
	if (!match) {
		return
	}

	// Get type info
	tag = match[1]
	typeInfo = taggedTypes[tag]
	if (!typeInfo) {
		return
	}

	// Special no-'()' case: only match 'tag' if minArgs is zero
	if (typeInfo.minArgs > 0 && match[2] === undefined) {
		return
	}

	// Parse and check args
	args = (match[2] || '').trim().split(/\s*,\s*/)
	if (args.length === 1 && args[0] === '') {
		// Especial empty case
		args = []
	}
	args = args.map(function (arg, i) {
		if (!arg) {
			if (!typeInfo.sparse) {
				throw new Error('Missing argument at position ' + i + ' for tagged type ' + tag)
			}
			return
		}

		if (typeInfo.numeric) {
			arg = Number(arg)
			if (Number.isNaN(arg)) {
				throw new Error('Invalid numeric argument at position ' + i + ' for tagged type ' + tag)
			}
		}

		return arg
	})
	args.original = definition
	if (args.length < typeInfo.minArgs) {
		throw new Error('Too few arguments for tagged type ' + tag)
	} else if (typeInfo.maxArgs && args.length > typeInfo.maxArgs) {
		throw new Error('Too much arguments for tagged type ' + tag)
	}

	return new Field(typeInfo.type, args)
}

var JSONMap = {
	$Number: Number,
	$String: String,
	$Object: Object,
	$Array: Array,
	$Boolean: Boolean,
	$Date: Date,
}

/**
 * This function is given to be used with JSON.parse() as the 2nd parameter:
 * parse(JSON.parse(JSON.stringify(aField), reviver)) would give the aField back
 * @param {string} key
 * @param {*} value
 * @returns {*}
 */
module.exports.reviver = function (key, value) {
	var match

	if (typeof value === 'string' && value[0] === '$') {
		// Special types

		if (value.indexOf('$RegExp:') === 0) {
			match = value.match(/^\$RegExp:(.*?):(.*)$/)
			return new RegExp(match[2], match[1])
		} else if (value in JSONMap) {
			return JSONMap[value]
		}
	}

	return value
}