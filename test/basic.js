/* globals describe, it*/
'use strict'

require('should')

let validate = require('../')()

describe('basic types', () => {
	let fields

	it('should parse basic types', () => {
		fields = validate.parse({
			aNumber: Number,
			aString: String,
			'optional?': Boolean
		})
	})

	it('should validate basic types', () => {
		fields.validate({
			aNumber: 17,
			aString: 'hi'
		}).should.be.true()

		fields.validate({
			aNumber: -2,
			aString: 'Hello',
			optional: true
		}).should.be.true()
	})

	it('should report the right error', () => {
		validate({
			key: Number
		}, {
			key: '12'
		}).should.be.false()
		validate.lastError.should.be.equal('I was expecting number and you gave me string in key')
		validate.lastErrorMessage.should.be.equal('I was expecting number and you gave me string')
		validate.lastErrorPath.should.be.equal('key')
	})

	it('should not escape HTML', () => {
		let obj = {
			aNumber: 0,
			aString: 'escape <html>'
		}
		fields.validate(obj).should.be.true()
		obj.aString.should.be.equal('escape <html>')
	})

	it('should not allow extraneous keys in strict mode', () => {
		validate({
			a: Number,
			'b?': Number
		}, {
			a: 3,
			b: 14,
			c: 15
		}, {
			strict: true
		}).should.be.false()
	})

	it('should allow and remove extraneous keys with undefined in strict mode', () => {
		let obj = {
			a: 3,
			b: 14,
			c: undefined
		}

		validate({
			a: Number,
			'b?': Number
		}, obj, {
			strict: true
		}).should.be.true()

		obj.should.be.eql({
			a: 3,
			b: 14
		})
	})

	it('should escape HTML when told to', () => {
		let obj = {
			aNumber: 0,
			aString: 'escape <html>'
		}
		fields.validate(obj, {
			escape: true
		}).should.be.true()
		obj.aString.should.be.equal('escape &lt;html&gt;')
	})

	it('should not accept a missing key', () => {
		fields.validate({
			aNumber: 0
		}).should.be.false()
		fields.lastError.should.be.equal('I was expecting a value in aString')
	})

	it('should not accept NaN, Infinity and -Infinity', () => {
		fields.validate({
			aNumber: NaN
		}).should.be.false()
		fields.validate({
			aNumber: Infinity
		}).should.be.false()
		fields.validate({
			aNumber: -Infinity
		}).should.be.false()
	})

	it('should not accept an empty string', () => {
		fields.validate({
			aNumber: 0,
			aString: ''
		}).should.be.false()
		fields.lastError.should.be.equal('I was expecting a non-empty value in aString')
	})

	it('should work for null-prototype maps', () => {
		let map = Object.create(null)
		map.a = String
		validate(map, {
			a: 'hi'
		}).should.be.true()
	})

	it('should work for string with fixed size', () => {
		validate('string(5)', '12345').should.be.true()
		validate('string(5)', '1234').should.be.false()
		validate('string(5)', '123456').should.be.false()
	})

	it('should work for string with min and max size', () => {
		validate('string(,5)', '12345').should.be.true()
		validate('string(,5)', '123456').should.be.false()

		validate('string(5,)', '1234').should.be.false()
		validate('string(5,)', '12345').should.be.true()

		validate('string(5,6)', '1234').should.be.false()
		validate('string(5,6)', '12345').should.be.true()
		validate('string(5,6)', '123456').should.be.true()
		validate('string(5,6)', '1234567').should.be.false()
	})

	it('should work for hex strings', () => {
		validate('hex', 'babaca').should.be.true()
		validate('hex', 'babacx').should.be.false()
		validate('hex', 'babac').should.be.false()
		validate('hex(2)', 'ab').should.be.true()
		validate('hex(2)', 'abab').should.be.false()
		validate('hex(5)', 'babac').should.be.true()
	})

	it('should work for base64 strings', () => {
		validate('base64', 'AA==').should.be.true()
		validate('base64', 'AAA=').should.be.true()
		validate('base64', 'AAAA').should.be.true()

		validate('base64', 'AAA').should.be.false()
		validate('base64', '$').should.be.false()
	})

	it('should work for set of strings', () => {
		validate('in(ab, cd, ef)', 'ab').should.be.true()
		validate('in(ab, cd, ef)', 'gh').should.be.false()
		validate('in()', 'a').should.be.false()
		validate('in(1, 2, 3)', 2).should.be.false()
	})

	it('should work for numeric types', () => {
		validate(Number, 3.14).should.be.true()
		validate(Number, '3.14').should.be.false()

		validate('int', -3).should.be.true()
		validate('int', 3).should.be.true()
		validate('int', '3').should.be.false()

		validate('uint', -3).should.be.false()
		validate('uint', 3).should.be.true()
		validate('uint', '3').should.be.false()
	})

	it('should work for numeric ranges', () => {
		validate('number(-2.5, 3.5)', -2.6).should.be.false()
		validate('number(-2.5, 3.5)', -2.5).should.be.true()
		validate('number(-2.5, 3.5)', -2).should.be.true()
		validate('number(-2.5, 3.5)', 0).should.be.true()
		validate('number(-2.5, 3.5)', 3).should.be.true()
		validate('number(-2.5, 3.5)', 3.5).should.be.true()
		validate('number(-2.5, 3.5)', 3.6).should.be.false()

		validate('int(-2.5, 3.5)', -2.6).should.be.false()
		validate('int(-2.5, 3.5)', -2.5).should.be.false()
		validate('int(-2.5, 3.5)', -2).should.be.true()
		validate('int(-2.5, 3.5)', 0).should.be.true()
		validate('int(-2.5, 3.5)', 3).should.be.true()
		validate('int(-2.5, 3.5)', 3.5).should.be.false()
		validate('int(-2.5, 3.5)', 3.6).should.be.false()

		validate('uint(-2.5, 3.5)', -2.6).should.be.false()
		validate('uint(-2.5, 3.5)', -2.5).should.be.false()
		validate('uint(-2.5, 3.5)', -2).should.be.false()
		validate('uint(-2.5, 3.5)', 0).should.be.true()
		validate('uint(-2.5, 3.5)', 3).should.be.true()
		validate('uint(-2.5, 3.5)', 3.5).should.be.false()
		validate('uint(-2.5, 3.5)', 3.6).should.be.false()
	})

	it('should work for set of numbers', () => {
		validate('numberIn(3, 1.4, -15)', 3).should.be.true()
		validate('numberIn(3, 1.4, -15)', 1.4).should.be.true()
		validate('numberIn(3, 1.4, -15)', -15).should.be.true()

		validate('numberIn(3, 1.4, -15)', 0).should.be.false()
		validate('numberIn(3, 1.4, -15)', '3').should.be.false()
	})

	it('should accept anything for *', () => {
		validate('*', 3.14).should.be.true()
		validate('*', 'Hello').should.be.true()
		validate('*', false).should.be.true()
		validate('*', {
			a: 2
		}).should.be.true()
		validate('*', [
			[3],
			[14]
		]).should.be.true()
		validate('*', null).should.be.true()

		validate({
			a: '*'
		}, {
			a: 'Something'
		}).should.be.true()
		validate({
			a: '*'
		}, {
			a: null
		}).should.be.false()
		validate({
			'a?': '*'
		}, {
			a: null
		}).should.be.true()
	})

	it('should not consider an array a valid object (and vice versa)', () => {
		validate({
			0: Number,
			length: Number
		}, [12]).should.be.false()

		validate([Number], {
			0: 12,
			length: 1
		}).should.be.false()
	})

	it('should accept a Date for Date', () => {
		validate(Date, new Date).should.be.true()
	})

	it('should call toJSON when present', () => {
		validate({
			a: Number
		}, {
			toJSON () {
				return {
					a: 12
				}
			}
		}).should.be.true()
	})
})