/* globals describe, it */
'use strict'

let should = require('should')

let validate = require('../')()

describe('typedef', () => {
	it('should define basic typedefs', () => {
		validate.typedef('my-number', Number)
		validate.typedef('my-obj', {
			a: 'uint',
			b: [String]
		})

		let baseNumber = validate.parse(Number),
			baseObj = validate.parse({
				a: 'uint',
				b: [String]
			})
		baseNumber.typedefName = 'my-number'
		baseObj.typedefName = 'my-obj'

		validate.parse('my-number').should.be.eql(baseNumber)
		validate.parse('my-obj').should.be.eql(baseObj)
	})

	it('should define pre and post hooks', () => {
		validate.typedef('datetime', {
			date: 'in(now, givenDate, never)',
			'givenDate?': Date
		}, null, value => {
			if (value.date === 'givenDate' && !value.givenDate) {
				throw 'I was expecting to be given a date'
			}
			return value.date === 'now' ? new Date(17) : (value.date === 'never' ? null : value.givenDate)
		})

		check({
			date: 'now'
		}, true).should.be.eql(new Date(17))
		should(check({
			date: 'never'
		}, true)).be.eql(null)
		check({
			date: 'givenDate',
			givenDate: new Date(0)
		}, true).should.be.eql(new Date(0))
		check({
			date: 'givenDate'
		}, false)

		function check(value, isValid) {
			let arr = [value]
			validate(['datetime'], arr).should.be.equal(isValid)
			return arr[0]
		}
	})

	it('should run pre-hooks before testing for emptiness', () => {
		validate.typedef('double-or-nothing', {
			a: Number
		}, value => {
			if (value === 0) {
				return null
			}
			return {
				a: 2 * value
			}
		})

		should(check(17)).be.eql({
			x: {
				a: 34
			}
		})
		should(check(0)).be.eql({})

		function check(value) {
			let obj = {
				x: value
			}
			validate({
				'x?': 'double-or-nothing'
			}, obj).should.be.equal(true)
			return obj
		}
	})
})