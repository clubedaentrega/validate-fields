/*globals describe, it*/
'use strict'

require('should')
var validate = require('../')()

describe('readme examples', function () {
	it('should work for the basic example', function () {
		var schema = {
				name: String,
				age: 'uint'
			},
			value = {
				name: 'Ann',
				age: 27
			}

		validate(schema, value).should.be.true
	})

	it('should work for the pre-parsing example', function () {
		var schema = validate.parse([String])

		schema.validate(['a', 'b']).should.be.true
	})

	it('should work for escaping example', function () {
		var v = ['<html>']
		validate([String], v)
		v[0].should.be.equal('<html>')
		validate([String], v, {
			escape: true
		})
		v[0].should.be.equal('&lt;html&gt;')

		v = ['<html>']
		validate.parse([String]).validate(v, {
			escape: true
		})
		v[0].should.be.equal('&lt;html&gt;')
	})

	it('should work for the strict matching example', function () {
		validate({}, {
			a: 2
		}, {
			strict: true
		}).should.be.false
	})

	it('should work for the hash map example', function () {
		var obj = {
			a: '',
			b: null
		}
		validate({
			'a?': String,
			'b?': 'int'
		}, obj).should.be.true
		obj.should.be.eql({})
	})

	it('should work for the typedef example', function () {
		validate.typedef('name', {
			first: String,
			'last?': String
		})
		validate.typedef('zip-code', /^\d{5}([- ]\d{4})?$/)

		validate('name', {
			last: 'Souza'
		}).should.be.false
		validate.lastError.should.be.equal('I was expecting a value in first')
		validate(['zip-code'], ['12345', '12345-1234']).should.be.true
	})

	it('should work for the simple custom type example', function () {
		validate.registerType('divBy3', 'number', function (value) {
			if (value % 3 !== 0) {
				throw 'I was expecting a number divisible by 3'
			}
			return value / 3
		})
		var obj = {
			n: 12
		}
		validate({
			n: 'divBy3'
		}, obj).should.be.true
		obj.n.should.be.equal(4)
	})

	it('should work for the tagged custom type example', function () {
		validate.registerTaggedType({
			tag: 'divBy',
			jsonType: 'number',
			minArgs: 1,
			maxArgs: 1,
			sparse: false,
			numeric: true
		}, function (value, args) {
			var n = args[0]
			if (value % n !== 0) {
				throw 'I was expecting a number divisible by ' + n
			}
			return value / n
		})
		validate('divBy(17)', 35).should.be.false
		validate('divBy(35)', 35).should.be.true
	})

	it('should work for serialization examples', function () {
		var fields = validate.parse({
			name: String,
			age: 'uint',
			'birth?': Date
		})
		JSON.stringify(fields).should.be.equal('{"name":"$String","age":"uint","birth?":"$Date"}')

		var fields2 = validate.parse({
				myType: 'divBy(7)'
			}) // defined above
		JSON.stringify(fields2).should.be.equal('{"myType":"$Number"}')

		var serializedFields = '{"name":"$String","age":"uint","birth?":"$Date"}'
		var definition = JSON.parse(serializedFields, validate.reviver)
		definition.should.be.eql({
			name: String,
			age: 'uint',
			'birth?': Date
		})
		var fields3 = validate.parse(definition)

		fields3.validate({
			name: 'John',
			age: 12
		}).should.be.true
	})
})