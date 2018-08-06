/* globals describe, it*/
'use strict'

require('should')

let validate = require('../')()

describe('partial', () => {
	it('should work with simple field at the root level', () => {
		check({
			a: Number,
			b: Number
		}, {
			a: 17
		}, [{
			partial: ['a'],
			error: ''
		}, {
			partial: ['b'],
			error: 'I was expecting a value in b'
		}, {
			partial: ['a', 'b'],
			error: 'I was expecting a value in b'
		}])
	})

	it('should work with fields in nested objects', () => {
		check({
			a: {
				b: {
					c: Number,
					d: Number
				}
			}
		}, {
			a: {
				b: {
					c: 17
				}
			}
		}, [{
			partial: null,
			error: 'I was expecting a value in a.b.d'
		}, {
			partial: [],
			error: ''
		}, {
			partial: ['a'],
			error: 'I was expecting a value in a.b.d'
		}, {
			partial: ['a.b'],
			error: 'I was expecting a value in a.b.d'
		}, {
			partial: ['a.b.c'],
			error: ''
		}, {
			partial: ['a.b.d'],
			error: 'I was expecting a value in a.b.d'
		}])
	})

	it('should work with fields in nested arrays', () => {
		check({
			a: [{
				b: [Number],
				c: Number
			}]
		}, {
			a: [{
				b: [17]
			}, {
				c: 17
			}]
		}, [{
			partial: null,
			error: 'I was expecting a value in a.0.c'
		}, {
			partial: ['a'],
			error: 'I was expecting a value in a.0.c'
		}, {
			partial: ['a.b'],
			error: 'I was expecting a value in a.1.b'
		}, {
			partial: ['a.c'],
			error: 'I was expecting a value in a.0.c'
		}])

		check({
			a: [{
				value: Number,
				text: String
			}]
		}, {
			a: [{
				value: 3
			}, {
				value: 14
			}, {
				value: '15'
			}]
		}, [{
			partial: null,
			error: 'I was expecting a value in a.0.text'
		}, {
			partial: ['a.value'],
			error: 'I was expecting number and you gave me string in a.2.value'
		}])
	})

	it('should not allow extra data in strict mode', () => {
		check({
			a: Number,
			b: Number
		}, {
			a: 17,
			c: 17 // <-- extra
		}, [{
			partial: ['a'],
			error: 'I wasn\'t expecting a value in c'
		}], true)

		check({
			a: Number,
			b: Number
		}, {
			a: 17,
			b: 17 // <-- extra
		}, [{
			partial: ['a'],
			error: 'I wasn\'t expecting a value in b'
		}], true)
	})

	it('should not allow extra field in partial in strict mode', () => {
		check({
			a: Number,
			b: Number
		}, {
			a: 17
		}, [{
			partial: ['a', 'c'],
			error: 'I wasn\'t expecting an unknown partial field in c'
		}], true)
	})
})

function check(schema, value, partials, strict = false) {
	for (let {
			partial,
			error
		} of partials) {
		let valid = validate(schema, value, {
			partial,
			strict
		})
		let gotErr = valid ? '' : validate.lastError
		gotErr.should.be.eql(error, 'Failed for partial: ' + partial)
	}
}