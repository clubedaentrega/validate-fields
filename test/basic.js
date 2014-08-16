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
		}).should.be.true

		fields.validate({
			aNumber: -2,
			aString: 'Hello',
			optional: true
		}).should.be.true
	})

	it('should not escape HTML', function () {
		var obj = {
			aNumber: 0,
			aString: 'escape <html>'
		}
		fields.validate(obj).should.be.true
		obj.aString.should.be.equal('escape <html>')
	})

	it('should escape HTML when told to', function () {
		var obj = {
			aNumber: 0,
			aString: 'escape <html>'
		}
		fields.validate(obj, {
			escape: true
		}).should.be.true
		obj.aString.should.be.equal('escape &lt;html&gt;')
	})

	it('should not accept a missing key', function () {
		fields.validate({
			aNumber: 0
		}).should.be.false
		fields.lastError.should.be.equal('I was expecting a value in aString')
	})

	it('should not accept an empty string', function () {
		fields.validate({
			aNumber: 0,
			aString: ''
		}).should.be.false
		fields.lastError.should.be.equal('I was expecting a non-empty value in aString')
	})
})