/*globals describe, it*/
'use strict'

require('should')

var validate = require('../index.js')

describe('basic types', function () {
	var fields

	it('should parse basic types', function () {
		fields = validate.parse({
			aNumber: Number,
			aString: String,
			'optional?': Boolean
		})
	})

	it('should validate basic types', function () {
		fields.validate({
			aNumber: 17,
			aString: 'hi'
		})

		fields.validate({
			aNumber: -2,
			aString: 'Hello',
			optional: true
		})
	})

	it('should escape HTML', function () {
		fields.validate({
			aNumber: 0,
			aString: 'escape <html>'
		}).aString.should.be.equal('escape &lt;html&gt;')
	})

	it('should not accept a missing key', function () {
		(function () {
			fields.validate({
				aNumber: 0
			})
		}).should.throw('I was expecting a value in aString')
	})

	it('should not accept an empty string', function () {
		(function () {
			fields.validate({
				aNumber: 0,
				aString: ''
			})
		}).should.throw('I was expecting a non-empty value in aString')
	})
})