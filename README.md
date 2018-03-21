# Validate Fields
[![Build Status](https://travis-ci.org/clubedaentrega/validate-fields.svg?branch=master)](https://travis-ci.org/clubedaentrega/validate-fields)
[![Inline docs](http://inch-ci.org/github/clubedaentrega/validate-fields.svg?branch=master)](http://inch-ci.org/github/clubedaentrega/validate-fields)
[![Dependency Status](https://david-dm.org/clubedaentrega/validate-fields.svg)](https://david-dm.org/clubedaentrega/validate-fields)

A simple yet powerful JSON schema validator

## Install
`npm install validate-fields`

## Usage

### Basic
```javascript
let validate = require('validate-fields')(),
	schema = {
		name: String,
		age: 'uint'
	}, value = {
		name: 'Ann',
		age: 27
	}

// Validate the value against the schema definition
if (validate(schema, value)) {
	console.log('Valid!')
} else {
	console.log('Invalid', validate.lastError)
}
```
`validate` throws if it could not understand the schema and returns false if the schema is ok but the value doesn't match the schema.

`validate.lastError`, `validate.lastErrorMessage` and `validate.lastErrorPath` will let you know about the validation error cause

See the list of valid values for the schema bellow

### Pre-parsing
```javascript
// Parse the schema once and store it
let schema = validate.parse([String]) // an array of non-empty strings

// Set express route
// app here is an express instance, used only to ilustrate this example (not part of this module!)
app.post('/api/posts/by-tags', function (req, res, next) {
	// Validate using the parsed schema
	if (schema.validate(req.body)) {
		next()
	} else {
		// Answer with error (note that we're not using validate.lastError here)
		res.status(400).send(schema.lastError)
	}
}, handlePostsByTags)
```
This way is recommended because if the schema definition is invalid, `validate.parse()` will throw early and `schema.validate()` won't throw. You also gain in speed!

## Escaping HTML
HTML strings can be escaped by sending one more argument to `validate`:
```javascript
let v = ['html>']
validate([String], v)
v[0] === 'html>'

validate([String], v, {
	escape: true
})
v[0] === 'html&gt;'
```
Or, using pre-parsing
```javascript
let v = ['html>']
validate.parse([String]).validate(v, {
	escape: true
})
v[0] === 'html&gt;'
```

## Strict matching
By default, extra keys are not considered errors:
```javascript
validate({}, {a: 2}) // true
```

This can be changed with the `strict` option:
```javascript
validate({}, {a: 2}, {strict: true}) // false
```

## Standard types

### Hash map (object)
Example: `{a: Number, 'b?': String, c: {d: 'int'}}`

Keys that end in `'?'` are optional (`b`, in the example above). All others must be present and must not empty. Empty is `null` or `undefined`; for strings, `''` is also considered empty.

If a value is optional and is empty it will be removed. Example:
```javascript
let obj = {a: '', b: null}
validate({'a?': String, 'b?': 'int'}, obj) // true
obj // {}
```

Optional fields may declare a default value to use in its place when empty. Example:
```js
let obj = {}
validate({'a=12': Number, 'b=[]': [String], 'c="hi"': String}, obj) // true
obj // {a: 12, b: [], c: 'hi'}
```

The value after the `=` character must be a valid JSON.

### Array
Example: `{books: [{title: String, author: String}]}`

### Other types
* `Number`: a double
* `String`: a string
* `Object`: any non-null object
* `Array`: any array
* `Boolean`
* `Date`: any date string accepted by Date constructor (ISO strings are better though)
* `'*'`: anything
* `'number(-3.5,10)'`: a number `x` with `-3.5 <= x <= 10`
* `'number(-3.5,)'`: a number `x` with `-3.5 <= x`
* `'number(,10)'`: a number `x` with `x <= 10`
* `'numeric'`: a double value encoded in a string
* `'numeric(<...>)'`: like `'number(<...>)'`, but for numeric strings
* `'int'`: an integer between -2^51 and 2^51 (safe integer)
* `'int(-3,10)'`: an integer between -3 and 10. Lower and upper bounds are optional
* `'numericInt'`: like `'int'`, but for numeric strings
* `'uint'`: a natural number less than 2^51
* `'uint(3,10)'`: a natural number between 3 and 10. Lower and upper bounds are optional
* `'numericUint'`: like `'int'`, but for numeric strings
* `'string(17)'`: a string with exactly 17 chars
* `'string(,100)'`: at most 100 chars
* `'string(8,)'`: at least 8 chars
* `'string(8,100)'`: at most 100, at least 8
* `'hex'`: a hex string (even number of hex-chars)
* `'hex(12)'`: a hex-string with exactly 12 hex-chars (that is, 6 bytes)
* `'base64'`: a base64 string, with valid padding
* `'id'`: a mongo objectId as a 24-hex-char string
* `'email'`: a string that looks like an email address
* `'in(cat, dog, cow)'`: a string in the given set of strings
* `'numberIn(3, 1.4, -15)'`: a number in the given set of values
* `'numericIn(<...>)'`: like `'numberIn(<...>)'`, but for numeric strings
* `/my-own-regex/`: a string that matches the custom regexp

## Custom types
The simplest way to define your own type is like this:
```javascript
validate.typedef('name', {
	first: String,
	'last?': String
})
validate.typedef('zip-code', /^\d{5}([- ]\d{4})?$/)

validate('name', {last:'Souza'}) // false
validate.lastError // 'I was expecting a value in first'
validate(['zip-code'], ['12345', '12345-1234']) // true
```
Typedef works as a simple alias (like in C)

Each type you call `require('validate-fields')()` a new context is created. Each context is isolated from each other. Types defined in one context do not conflict with other contexts.

If you need more power, you can create the type from scratch and define every detail about the validation.

In the example bellow, we create a type defined by 'divBy3' that matches JSON numbers.
The third param is the check function, that should throw when the value is invalid.
It may return a new value, that will replace the original value in the object
```javascript
validate.registerType('divBy3', 'number', function (value) {
	if (value%3 !== 0) {
		// Note: you should throw a string
		// If you throw an Error instance it won't be caught!
		throw 'I was expecting a number divisible by 3'
	}
	return value/3
})

let obj = {n: 12}
validate({n: 'divBy3'}, obj) // true
obj.n // 4
```

In the example bellow, we implement the general case of the above. Instead of a fixed string (divBy3) we define a syntax like `'divBy(n)'` where `n` is a number. The "argument" list is sent as the third parameter to the check function.
```javascript
validate.registerTaggedType({
	tag: 'divBy',
    jsonType: 'number',
    minArgs: 1, // default = 0. If 0, 'tag' and 'tag()' are equal
    maxArgs: 1, // default = 0 = no limit
    sparse: false, // default = false. If true, let arguments be skipped: 'tag(1,,2)'
    numeric: true // default = false. If true, parse all arguments as numbers
}, function (value, args) {
	let n = args[0]
	if (value%n !== 0) {
		throw 'I was expecting a number divisible by '+n
	}
	return value/n
})
validate('divBy(17)', 35) // false
validate('divBy(35)', 35) // true
```
See more examples in the folder `types`. All core types are defined there

Finally, you can extend a type by providing pre and post hooks:
```javascript
validate.typedef('time-in', {
	hour: /^\d\d$/,
	minute: /^\d\d$/
}, null, value => {
	// Convert that object to a string like 'HH:MM'
	return value.hour + ':' + value.minute
})

validate.typedef('time-out', {
	hour: /^\d\d$/,
	minute: /^\d\d$/
}, value => ({
	// Convert 'HH:MM' to an object
	hour: value.slice(0, 2),
	minute: value.slice(3, 5)
}))
```

Pre-hooks will be executed before the base type checks. Post-hooks will be run afterwards.

## Interchangeable format
A parsed `Field` can be serialized to JSON with `JSON.stringify()`:
```javascript
let fields = validate.parse({name: String, age: 'uint', 'birth?': Date})
JSON.stringify(fields) // '{"name":"$String","age":"uint","birth?":"$Date"}'
```

Note that custom types can't be serialized, they are replaced by their JSON-type:
```javascript
let fields = validate.parse({myType: 'divBy(7)'}) // defined above
JSON.stringify(fields) // '{"myType":"$Number"}'
```

To get back a `Field` instance, `JSON.parse()` should be used with a reviver and the result then parsed:
```javascript
let serializedFields = '{"name":"$String","age":"uint","birth?":"$Date"}'
let definition = JSON.parse(serializedFields, validate.reviver) // {name: String, age: 'uint', 'birth?': Date}
let fields = validate.parse(definition)

fields.validate({name: 'John', age: 12}) // true
```

## JSON Schema
A parsed `Field` can be exported as [JSON Schema](http://json-schema.org/):
```javascript
let fields = validate.parse({name: String, age: 'uint', 'birth?': Date})
fields.toJSONSchema()
/* {
	type: 'object',
	properties: {
		name: {
			type: 'string'
		},
		age: {
			type: 'integer',
			minimum: 0
		},
		birth: {
			type: 'string',
			format: 'date-time'
		}
	},
	required: ['name', 'age']
} */
```
