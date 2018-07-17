/* globals describe, it*/
'use strict'

require('should')
let validate = require('../')()

describe('JSONSchema', () => {
	it('should work for object types', () => {
		validate.parse({
			number: Number,
			string: String,
			object: Object,
			array: Array,
			boolean: Boolean,
			date: Date
		}).toJSONSchema().should.be.eql({
			type: 'object',
			properties: {
				number: {
					type: 'number'
				},
				string: {
					type: 'string'
				},
				object: {
					type: 'object'
				},
				array: {
					type: 'array'
				},
				boolean: {
					type: 'boolean'
				},
				date: {
					type: 'string',
					format: 'date-time'
				}
			},
			required: ['number', 'string', 'object', 'array', 'boolean', 'date']
		})
	})

	it('should work for hash and array', () => {
		validate.parse({
			required: Number,
			'optional?': Number,
			numbers: [Number],
			other: {
				another: [{
					evenMore: Number
				}]
			}
		}).toJSONSchema().should.be.eql({
			type: 'object',
			properties: {
				required: {
					type: 'number'
				},
				optional: {
					type: 'number'
				},
				numbers: {
					type: 'array',
					items: {
						type: 'number'
					}
				},
				other: {
					type: 'object',
					properties: {
						another: {
							type: 'array',
							items: {
								type: 'object',
								properties: {
									evenMore: {
										type: 'number'
									}
								},
								required: ['evenMore']
							}
						}
					},
					required: ['another']
				}
			},
			required: ['required', 'numbers', 'other']
		})
	})

	it('should work for string types', () => {
		validate.parse({
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
		}).toJSONSchema().should.be.eql({
			type: 'object',
			properties: {
				int: {
					type: 'integer'
				},
				uint: {
					type: 'integer',
					minimum: 0
				},
				string: {
					type: 'string',
					minLength: 17,
					maxLength: 17
				},
				string2: {
					type: 'string',
					maxLength: 100
				},
				string3: {
					type: 'string',
					minLength: 8
				},
				string4: {
					type: 'string',
					minLength: 8,
					maxLength: 100
				},
				hex: {
					type: 'string',
					format: 'hex'
				},
				hex2: {
					type: 'string',
					format: 'hex',
					minLength: 12,
					maxLength: 12
				},
				id: {
					type: 'string',
					format: 'id'
				},
				email: {
					type: 'string',
					format: 'email'
				},
				enum: {
					type: 'string',
					enum: ['cat', 'dog', 'cow']
				}
			},
			required: ['int', 'uint', 'string', 'string2', 'string3', 'string4', 'hex', 'hex2', 'id', 'email', 'enum']
		})
	})

	it('should work for regex', () => {
		validate.parse({
			simple: /hi/,
			global: /hi/g,
			flags: /hi/mi,
			escaped: /^\/\\\.$/
		}).toJSONSchema().should.be.eql({
			type: 'object',
			properties: {
				simple: {
					type: 'string',
					pattern: 'hi'
				},
				global: {
					type: 'string',
					pattern: 'hi',
					'x-flags': 'g'
				},
				flags: {
					type: 'string',
					pattern: 'hi',
					'x-flags': 'im'
				},
				escaped: {
					type: 'string',
					pattern: '^\\/\\\\\\.$'
				}
			},
			required: ['simple', 'global', 'flags', 'escaped']
		})
	})

	it('should work for typedefs', () => {
		validate.typedef('user', {
			name: String
		})

		validate.parse('user').toJSONSchema().should.be.eql({
			type: 'object',
			properties: {
				name: {
					type: 'string'
				}
			},
			required: ['name']
		})

		validate.parse({
			user: 'user'
		}).toJSONSchema().should.be.eql({
			type: 'object',
			properties: {
				user: {
					type: 'object',
					properties: {
						name: {
							type: 'string'
						}
					},
					required: ['name']
				}
			},
			required: ['user']
		})

		validate.parse('user').toJSONSchema('#/some/path').should.be.eql({
			type: 'object',
			properties: {
				name: {
					type: 'string'
				}
			},
			required: ['name']
		})

		validate.parse('user').toJSONSchema('#/some/path', true).should.be.eql({
			$ref: '#/some/path/user'
		})

		validate.parse({
			user: 'user'
		}).toJSONSchema('#/some/path').should.be.eql({
			type: 'object',
			properties: {
				user: {
					$ref: '#/some/path/user'
				}
			},
			required: ['user']
		})
	})

	it('should turn custom types into more general types', () => {
		validate.registerType('my-string', 'string')
		validate.registerType('my-number', 'number')
		validate.registerType('my-boolean', 'boolean')
		validate.registerType('my-object', 'object')
		validate.registerType('my-array', 'array')
		validate.parse({
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
		}).toJSONSchema().should.be.eql({
			type: 'object',
			properties: {
				number: {
					type: 'number'
				},
				string: {
					type: 'string'
				},
				object: {
					type: 'object'
				},
				array: {
					type: 'array'
				},
				boolean: {
					type: 'boolean'
				}
			},
			required: ['string', 'number', 'boolean', 'object', 'array']
		})
	})
})