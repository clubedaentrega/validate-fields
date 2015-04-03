/*globals describe, it*/
'use strict'

require('should')
var validate = require('../')()

/**
 * @param {*} definition
 * @param {*} [finalDefinition=definition]
 */
function check(definition, finalDefinition) {
	var fields = validate.parse(definition),
		finalFields = finalDefinition ? validate.parse(finalDefinition) : fields,
		string = JSON.stringify(fields),
		parsed = JSON.parse(string, validate.reviver),
		fields2 = validate.parse(parsed)
	finalFields.should.be.eql(fields2)
}

describe('JSON', function () {
	it('should work for object types', function () {
		check({
			number: Number,
			string: String,
			object: Object,
			array: Array,
			boolean: Boolean,
			date: Date
		})
	})

	it('should work for hash and array', function () {
		check({
			required: Number,
			'optional?': Number,
			numbers: [Number],
			other: {
				another: [{
					evenMore: Number
				}]
			}
		})
	})

	it('should work for string types', function () {
		check({
			int: 'int',
			uint: 'uint',
			string: 'string(17)',
			string2: 'string(,100)',
			string3: 'string(8,)',
			string4: 'string(8,100)',
			hex: 'hex',
			hex2: 'hex(12)',
			id: 'id',
			email: 'email',
			enum: 'in(cat, dog, cow)'
		})
	})

	it('should work for regex', function () {
		check({
			simple: /hi/,
			global: /hi/g,
			flags: /hi/mi,
			escaped: /^\/\\\.$/
		})
	})

	it('should work for typedefs', function () {
		validate.typedef('user', {
			name: String,
			age: 'uint',
			birth: Date,
			'gender?': 'in(M, F)'
		})

		check('user')
	})

	it('should turn custom types into more general types', function () {
		validate.registerType('my-string', 'string')
		validate.registerType('my-number', 'number')
		validate.registerType('my-boolean', 'boolean')
		validate.registerType('my-object', 'object')
		validate.registerType('my-array', 'array')
		check({
			string: 'my-string',
			number: 'my-number',
			boolean: 'my-boolean',
			object: 'my-object',
			array: 'my-array'
		}, {
			string: String,
			number: Number,
			boolean: Boolean,
			object: Object,
			array: Array
		})
	})
})