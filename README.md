# Validate Fields

A simple yet powerful JSON schema validator

## Install
`npm install validate-fields --save`

## Usage

### Basic
```javascript
var validate = require('validate-fields'),
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
See the list of valid values for the schema bellow

### Pre-parsing
```javascript
// Parse the schema once and store it
var schema = validate.parse([String]) // a non-empty array of non-empty strings

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
var v = ['html>']
validate([String], v)
v[0] === 'html>'

validate([String], v, {
	escape: true
})
v[0] === 'html&gt;'
```
Or, using pre-parsing
```javascript
var v = ['html>']
validate.parse([String]).validate(v, {
	escape: true
})
v[0] === 'html&gt;'
```

## Standard types

### Hash map (object)
Example: `{a: Number, 'b?': String, c: {d: 'int'}}`

Keys that end in `'?'` are optional (`b`, in the example above). All others must be present and must not empty (that is, neither `''` nor `null` nor `undefined` nor `[]`).

If a value is optional and is empty it will be removed. Example:
```javascript
var obj = {a: '', b: null}
validate({'a?': String, 'b?': 'int'}, obj) // true
obj // {}
```

### Array
Example: `{books: [{title: String, author: String}]}`

### Other types
* `Number`: a double
* `String`: a non-empty string
* `Object`: any non-null object
* `Array`: any non-empty array
* `Boolean`
* `Date`: any date string accepted by Date constructor (ISO strings are better though)
* `'int'`: a integer between -2^51 and 2^51 (safe integer)
* `'uint'`: a natural number less than 2^51
* `'string(17)'`: a string with exactly 17 chars
* `'string(,100)'`: at most 100 chars
* `'string(8,)'`: at least 8 chars
* `'string(8,100)'`: at most 100, at least 8
* `'hex'`: a non-empty hex string
* `'hex(12)'`: a hex-string with exactly 12 hex-chars (that is, 6 bytes)
* `'id'`: a mongo objectId as a 24-hex-char string
* `'email'`: a string that looks like an email address
* `'in(cat, dog, cow)'`: a string in the given set of strings
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

If you need more power, you can create the type from scratch and define every detail about the validation.

In the example bellow, we create a type defined by 'divBy3' that matches JSON numbers.
The third param is the check function, that should throw when the value is invalid.
It may return a new value, that will replace the original value in the object
```javascript
validate.registerType('divBy3', 'number', function (value, path) {
	if (value%3 !== 0) {
		throw new Error('I was expecting a number divisible by 3 in '+path)
	}
	return value/3
})

var obj = {n: 12}
validate({n: 'divBy3'}, obj) // true
obj.n // 4
```

In the example bellow, we implement the general case of the above. Instead of a fixed string (divBy3) we define a regex that matches 'divBy' followed by a number. The result of the match goes into the extra array (sent as third parameter to the check function).
```javascript
validate.registerType(/^divBy(\d+)$/, 'number', function (value, path, extra) {
	var n = Number(extra[1]) // extra is value returned by String.prototype.match
	if (value%n !== 0) {
		throw new Error('I was expecting a number divisible by '+n+' in '+path)
	}
	return value/n
})
validate('divBy17', 35) // false
validate('divBy35', 35) // true
```
See more examples in the file `types.js`