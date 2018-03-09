/* globals describe, it*/
'use strict'

require('should')
let validate = require('../')()

/**
 * @param {*} definition
 * @param {*} [finalDefinition=definition]
 */
function check(definition, finalDefinition) {
	let fields = validate.parse(definition),
		finalFields = finalDefinition ? validate.parse(finalDefinition) : fields,
		string = JSON.stringify(fields),
		parsed = JSON.parse(string, validate.reviver),
		fields2 = validate.parse(parsed)
	finalFields.should.be.eql(fields2)
}

describe('JSON', () => {
	it('should work for object types', () => {
		check({
			number: Number,
			string: String,
			object: Object,
			array: Array,
			boolean: Boolean,
			date: Date
		})
	})

	it('should work for hash and array', () => {
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

	it('should work for string types', () => {
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

	it('should work for regex', () => {
		check({
			simple: /hi/,
			global: /hi/g,
			flags: /hi/mi,
			escaped: /^\/\\\.$/
		})
	})

	it('should work for typedefs', () => {
		validate.typedef('user', {
			name: String,
			age: 'uint',
			birth: Date,
			'gender?': 'in(M, F)'
		})

		check('user', {
			name: String,
			age: 'uint',
			birth: Date,
			'gender?': 'in(M, F)'
		})
	})

	it('should turn custom types into more general types', () => {
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

	it('should call toJSON on values', () => {
		let called = false
		validate(String, {
			toJSON () {
				called = true
				return 'a string'
			}
		}).should.be.true()
		called.should.be.true()
	})

	it('should not call toJSON on raw types', () => {
		validate.registerType('my-type', 'raw', () => {})

		let called = false
		validate('my-type', {
			toJSON () {
				called = true
				return 'a string'
			}
		}).should.be.true()
		called.should.be.false()

		// raw is converted to '*'
		check('my-type', '*')
	})
})