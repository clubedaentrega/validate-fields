/*globals describe, it*/
'use strict'

require('should')

var validate = require('../')()

describe('benchmark', function () {
	var parsed

	it('should parse fast', function () {
		var i
		this.timeout(50)
		for (i = 0; i < 1e3; i++) {
			parsed = validate.parse({
				store: {
					id: 'id',
					name: String
				},
				order: {
					items: [{
						price: Number,
						name: String
					}],
					totalPrice: Number,
					code: /^[0-9]{5}$/
				},
				user: {
					email: 'email',
					password: 'hex(32)'
				}
			})
		}
	})

	it('should validate fast', function () {
		var i
		this.timeout(50)
		for (i = 0; i < 1e3; i++) {
			parsed.validate({
				store: {
					id: '0123456789abcdef01234567',
					name: 'My Store'
				},
				order: {
					items: [{
						price: 3.14,
						name: 'tomato'
					}, {
						price: 2.17,
						name: 'banana'
					}],
					totalPrice: 5.31,
					code: '63947'
				},
				user: {
					email: 'user@email.com',
					password: '0123456789abcdef0123456789abcdef'
				}
			}).should.be.true
		}
	})
})