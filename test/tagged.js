/* globals describe, it*/
'use strict'

let should = require('should')

let validate = require('../')()

describe('tagged types', () => {
	it('should handle any number of args', () => {
		validate.registerTaggedType({
			tag: 'tagAny',
			jsonType: 'string'
		})

		checkExtra('tagAny', [])
		checkExtra('tagAny()', [])
		checkExtra('tagAny(a)', ['a'])
		checkExtra('tagAny(a, b)', ['a', 'b'])
		checkExtra('tagAny(a, b, c)', ['a', 'b', 'c'])

		should(() => {
			validate.parse('tagAny(a, , c)')
		}).throw('Missing argument at position 1 for tagged type tagAny')
	})

	it('should handle minimum number of args', () => {
		validate.registerTaggedType({
			tag: 'tagMin',
			jsonType: 'string',
			minArgs: 1
		})

		checkExtra('tagMin(a)', ['a'])
		checkExtra('tagMin(a, b)', ['a', 'b'])
		checkExtra('tagMin(a, b, c)', ['a', 'b', 'c'])

		should(() => {
			validate.parse('tagMin')
		}).throw('I couldn\'t understand field definition: tagMin')

		should(() => {
			validate.parse('tagMin()')
		}).throw('Too few arguments for tagged type tagMin')

		should(() => {
			validate.parse('tagMin(a, , c)')
		}).throw('Missing argument at position 1 for tagged type tagMin')
	})

	it('should handle maximum number of args', () => {
		validate.registerTaggedType({
			tag: 'tagMax',
			jsonType: 'string',
			maxArgs: 2
		})

		checkExtra('tagMax', [])
		checkExtra('tagMax()', [])
		checkExtra('tagMax(a)', ['a'])
		checkExtra('tagMax(a, b)', ['a', 'b'])

		should(() => {
			validate.parse('tagMax(a, b, c)')
		}).throw('Too many arguments for tagged type tagMax')

		should(() => {
			validate.parse('tagMax(a, , c)')
		}).throw('Missing argument at position 1 for tagged type tagMax')
	})

	it('should handle sparse args', () => {
		validate.registerTaggedType({
			tag: 'tagSparse',
			jsonType: 'string',
			sparse: true
		})

		checkExtra('tagSparse', [])
		checkExtra('tagSparse()', [])
		checkExtra('tagSparse(a)', ['a'])
		checkExtra('tagSparse(a, b)', ['a', 'b'])
		checkExtra('tagSparse(a, b, c)', ['a', 'b', 'c'])
		checkExtra('tagSparse(a, , c)', ['a', undefined, 'c'])
		checkExtra('tagSparse(, b, c)', [undefined, 'b', 'c'])
		checkExtra('tagSparse(a, b, )', ['a', 'b', undefined])
	})

	it('should handle numeric args', () => {
		validate.registerTaggedType({
			tag: 'tagNumeric',
			jsonType: 'string',
			numeric: true
		})

		checkExtra('tagNumeric', [])
		checkExtra('tagNumeric()', [])
		checkExtra('tagNumeric(1)', [1])
		checkExtra('tagNumeric(1, 2)', [1, 2])

		should(() => {
			validate.parse('tagNumeric(1, , 3)')
		}).throw('Missing argument at position 1 for tagged type tagNumeric')

		should(() => {
			validate.parse('tagNumeric(banana)')
		}).throw('Invalid numeric argument at position 0 for tagged type tagNumeric')
	})

	it('should call parse args callback', () => {
		validate.registerTaggedType({
			tag: 'tagParseArgs',
			jsonType: 'string',
			numeric: true,
			parseArgs (args) {
				return args.map((n, i) => n * i)
			}
		})

		validate.parse('tagParseArgs').extra.should.be.eql([])
		validate.parse('tagParseArgs()').extra.should.be.eql([])
		validate.parse('tagParseArgs(1)').extra.should.be.eql([0])
		validate.parse('tagParseArgs(1, 2, 3)').extra.should.be.eql([0, 2, 6])
	})
})

function checkExtra(definition, args) {
	args.original = definition
	validate.parse(definition).extra.should.be.eql(args)
}