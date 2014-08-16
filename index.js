'use strict'

var Field = require('./Field.js'),
	Type = require('./Type.js')

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

/**
 * Validate the given value against the given schema
 * @param {*} schema
 * @param {*} value The value can be altered by the validation
 * @param {Object} [options] Validation options
 * @returns {boolean} whether the value is valid or nor
 * @throw if the schema is invalid
 */
module.exports = function (schema, value, options) {
	schema = module.exports.parse(schema)
	var ret = schema.validate(value, options)
	module.exports.lastError = schema.lastError
	return ret
}

/**
 * Store the last error message
 * @property {string}
 */
module.exports.lastError = ''

/**
 * Parse the given fields definition
 * @param {Object} fields
 * @returns {Field} The parsed object that can be used with validate()
 * @throw if the definition is invalid
 */
module.exports.parse = function (fields) {
	var pos, i, extra

	if (typeof fields === 'string' && fields in simpleTypes) {
		// Type defined by a string
		return new Field(simpleTypes[fields])
	} else if (typeof fields === 'string' && fields in typedefs) {
		// Type defined by a string
		return typedefs[fields]
	} else if ((pos = objectTypes.objects.indexOf(fields)) !== -1) {
		// Type defined by an object
		return new Field(objectTypes.types[pos])
	} else {
		// Search by a type, executing the callbacks
		for (i = 0; i < callbackTypes.fns.length; i++) {
			extra = callbackTypes.fns[i](fields, module.exports.parse)
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
module.exports.typedef = function (name, definition) {
	if (typeof name !== 'string') {
		throw new Error('Invalid argument type for name, it must be a string')
	}
	definition = module.exports.parse(definition)
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
 * @param {string} path a string used in the error message
 * @param {*} extra the result of String.prototype.match if the type is defined with a regexp or the parseCallback result if defined with a function
 * @param {Object} options
 * @returns {*} optionally return the altered value
 * @throws if the value is invalid, the message will be put in the lastError property of the validation schema
 */

/**
 * Register a new type
 * @param {(string|Object|RegExp|parseCallback)} definition
 * @param {string} jsonType One of 'number', 'string', 'boolean', 'object' or 'array'
 * @param {checkCallback} [checkFn=function(){}]
 */
module.exports.registerType = function (definition, jsonType, checkFn) {
	var type = new Type(jsonType, checkFn || function () {})
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
 * Return a reference to all registered types
 * You can change it to alter the very inner working of this module
 * The two main types are:
 * * Hash map: callbackTypes.fns[0], callbackTypes.types[0]
 * * Array: callbackTypes.fns[1], callbackTypes.types[1]
 * @returns {{simpleTypes: Object.<string, Type>, typedefs: Field, objectTypes: {objects: Object[], types: Type[]}, callbackTypes: {fns: Function[], types: Type[]}}}
 */
module.exports.getRegisteredTypes = function () {
	return {
		simpleTypes: simpleTypes,
		typedefs: typedefs,
		objectTypes: objectTypes,
		callbackTypes: callbackTypes
	}
}

// Register standard types
require('./types.js')