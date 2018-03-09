/* globals describe, it*/
'use strict'

require('should')

let validate = require('../')()

describe('numeric types', () => {
	it('should parse numeric types', () => {
		validate.parse({
			numeric: 'numeric',
			numericRange: 'numeric(3.14, 15.92)',
			numericInt: 'numericInt',
			numericIntRange: 'numericInt(-3, 14)',
			numericUint: 'numericUint',
			numericUintRange: 'numericUint(3, 14)',
			numericIn: 'numericIn(3.14, 15.92, 65.35, 89.79)'
		})
	})

	it('should validate simple numeric, converting string to number', () => {
		test('numeric', '0', true, 0)
		test('numeric', '3.14000e-3', true, 0.00314)
		test('numeric', '0x10', true, 16)

		test('numeric(3.5, 4.5)', '0.35e1', true, 3.5)
		test('numeric(3.5, 4.5)', '45e-1', true, 4.5)
		test('numeric(3.5, 4.5)', '5', false)
	})

	it('should validate numeric int, converting string to number', () => {
		test('numericInt', '3', true, 3)
		test('numericInt', '-7', true, -7)
		test('numericInt', '3.1', false)

		test('numericInt(-2, 5)', '3', true, 3)
		test('numericInt(-2, 5)', '-7', false)
		test('numericInt(-2, 5)', '3.1', false)
	})

	it('should validate numeric uint, converting string to number', () => {
		test('numericUint', '3', true, 3)
		test('numericUint', '7', true, 7)
		test('numericUint', '-7', false)
		test('numericUint', '3.1', false)

		test('numericUint(2, 5)', '3', true, 3)
		test('numericUint(2, 5)', '7', false)
		test('numericUint(2, 5)', '3.1', false)
	})

	it('should validate numeric enum, converting string to number', () => {
		test('numericIn(3.14, 15.92)', '3.1400000000', true, 3.14)
		test('numericIn(3.14, 15.92)', '15.92', true, 15.92)
		test('numericIn(3.14, 15.92)', '15.93', false)
	})
})

/**
 * @param {string} type
 * @param {string} value
 * @param {boolean} expected
 * @param {number} [expectedValue]
 */
function test(type, value, expected, expectedValue) {
	let obj = {
		a: value
	}
	validate({
		a: type
	}, obj).should.be.equal(expected, validate.lastError)
	if (expectedValue !== undefined) {
		obj.a.should.be.equal(expectedValue)
	}
}