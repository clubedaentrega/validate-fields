/*globals describe, it*/
'use strict'

require('should')
var validate = require('../')()

describe('default values', function () {
	it('should work for basic default values', function () {
		var obj = {},
			obj2 = {
				noDefault: null,
				default: null
			},
			schema = validate.parse({
				'noDefault?': Number,
				'default=12': Number
			})

		schema.validate(obj).should.be.true
		obj.should.be.eql({
			default: 12
		})

		schema.validate(obj2).should.be.true
		obj2.should.be.eql({
			default: 12
		})
	})

	it('should check JSON syntax at parse time', function () {
		var boom = function () {
			validate.parse({
				'a=invalid JSON': Number
			})
		}
		boom.should.throw(/^I was expecting a valid JSON/)
	})

	it('should validate default value at parse time', function () {
		var boom = function () {
			validate.parse({
				'a="not a number"': Number
			})
		}
		boom.should.throw(/^I was expecting a valid default value/)
	})

	it('should apply subfields default values', function () {
		var obj = {}
		validate({
			'a={}': {
				'b=2': Number
			}
		}, obj)

		obj.should.be.eql({
			a: {
				b: 2
			}
		})
	})
})