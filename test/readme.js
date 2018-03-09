/* globals describe, it*/
'use strict'

require('should')
let validate = require('../')()

describe('readme examples', () => {
	it('should work for the basic example', () => {
		let schema = {
				name: String,
				age: 'uint'
			},
			value = {
				name: 'Ann',
				age: 27
			}

		validate(schema, value).should.be.true()
	})

	it('should work for the pre-parsing example', () => {
		let schema = validate.parse([String])

		schema.validate(['a', 'b']).should.be.true()
	})

	it('should work for escaping example', () => {
		let v = ['<html>']
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

	it('should work for the strict matching example', () => {
		validate({}, {
			a: 2
		}, {
			strict: true
		}).should.be.false()
	})

	it('should work for the hash map example', () => {
		let obj = {
			a: '',
			b: null
		}
		validate({
			'a?': String,
			'b?': 'int'
		}, obj).should.be.true()
		obj.should.be.eql({})
	})

	it('should work for the typedef example', () => {
		validate.typedef('name', {
			first: String,
			'last?': String
		})
		validate.typedef('zip-code', /^\d{5}([- ]\d{4})?$/)

		validate('name', {
			last: 'Souza'
		}).should.be.false()
		validate.lastError.should.be.equal('I was expecting a value in first')
		validate(['zip-code'], ['12345', '12345-1234']).should.be.true()
	})

	it('should work for the simple custom type example', () => {
		validate.registerType('divBy3', 'number', value => {
			if (value % 3 !== 0) {
				throw 'I was expecting a number divisible by 3'
			}
			return value / 3
		})
		let obj = {
			n: 12
		}
		validate({
			n: 'divBy3'
		}, obj).should.be.true()
		obj.n.should.be.equal(4)
	})

	it('should work for the tagged custom type example', () => {
		validate.registerTaggedType({
			tag: 'divBy',
			jsonType: 'number',
			minArgs: 1,
			maxArgs: 1,
			sparse: false,
			numeric: true
		}, (value, args) => {
			let n = args[0]
			if (value % n !== 0) {
				throw 'I was expecting a number divisible by ' + n
			}
			return value / n
		})
		validate('divBy(17)', 35).should.be.false()
		validate('divBy(35)', 35).should.be.true()
	})

	it('should work for serialization examples', () => {
		let fields = validate.parse({
			name: String,
			age: 'uint',
			'birth?': Date
		})
		JSON.stringify(fields).should.be.equal('{"name":"$String","age":"uint","birth?":"$Date"}')

		let fields2 = validate.parse({
				myType: 'divBy(7)'
			}) // defined above
		JSON.stringify(fields2).should.be.equal('{"myType":"$Number"}')

		let serializedFields = '{"name":"$String","age":"uint","birth?":"$Date"}'
		let definition = JSON.parse(serializedFields, validate.reviver)
		definition.should.be.eql({
			name: String,
			age: 'uint',
			'birth?': Date
		})
		let fields3 = validate.parse(definition)

		fields3.validate({
			name: 'John',
			age: 12
		}).should.be.true()
	})
})