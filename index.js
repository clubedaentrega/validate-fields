'use strict'

var Field = require('./Field.js'),
	Type = require('./Type.js')

/** Store types defined by a string */
var simpleTypes = Object.create(null)

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
 * @callback parseCallback
 * @param {*} definition
 * @param {function} parse
 * @returns {*}
 * @throws
 */

/**
 * @callback checkCallback
 * @param {*} value
 * @param {string} path
 * @param {*} extra
 * @returns {boolean}
 * @throws
 */

/**
 * Register a new type
 * @param {(string|Object|RegExp|parseCallback)} definition
 * @param {string} jsType
 * @param {checkCallback} [checkFn=function(){}]
 */
module.exports.registerType = function (definition, jsonType, checkFn) {
	var type = new Type(jsonType, checkFn || function () {})
	if (typeof definition === 'string') {
		// Simple definition: match a single string
		if (definition in simpleTypes) {
			throw new Error('Type ' + definition + ' already registered')
		}
		simpleTypes[definition] = type
	} else if (definition instanceof RegExp) {
		// Defined by a RegExp: create a callback
		if (jsonType !== 'string') {
			throw new Error('When defining a type with a RegExp, the jsonType must be string')
		}
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

// Register standard types
require('./types.js')