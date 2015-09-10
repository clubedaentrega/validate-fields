/*globals describe, it*/
'use strict'

require('should')
var validate = require('../')()

describe('emptiness', function () {
	var schema = validate.parse({
		'num?': Number,
		'str?': String,
		'bool?': Boolean,
		'obj?': Object,
		'arr?': Array,
		'*?': '*'
	})

	it('should consider missing field, undefined and null as empty', function () {
		schema.validate({}).should.be.true()
		schema.validate({
			num: undefined,
			str: undefined,
			bool: undefined,
			obj: undefined,
			arr: undefined,
			'*': undefined
		}).should.be.true()
		schema.validate({
			num: null,
			str: null,
			bool: null,
			obj: null,
			arr: null,
			'*': null
		}).should.be.true()
	})

	it('should consider "" as empty only if the field is of type string', function () {
		check('str').should.be.true()

		check('num').should.be.false()
		check('bool').should.be.false()
		check('obj').should.be.false()
		check('arr').should.be.false()

		function check(key) {
			var obj = {}
			obj[key] = ''
			return schema.validate(obj) && !(key in obj)
		}
	})

	it('should consider [] as valid but not empty if the field is of type array', function () {
		check('arr').should.be.true()

		check('str').should.be.false()
		check('num').should.be.false()
		check('bool').should.be.false()
		check('obj').should.be.false()

		function check(key) {
			var obj = {}
			obj[key] = []
			return schema.validate(obj) && (key in obj)
		}
	})

	it('should accept "" and [] for * fields and not consider it empty', function () {
		var obj1 = {
				'*': ''
			},
			obj2 = {
				'*': []
			}

		schema.validate(obj1)
		schema.validate(obj2)

		obj1['*'].should.be.equal('')
		obj2['*'].should.be.eql([])
	})
})