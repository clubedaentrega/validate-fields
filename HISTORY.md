# 5.1.0
* Added: option `partial` to allow for partial validation

# 5.0.0
## Breaking changes
* `Field#toJSONSchema()` when converting a type defined with typedef now behaves differently.
Now it returns the full description when called with no paramenters.
To use references, pass the base path as the first parameter, example: `Field#toJSONSchema('#/definitions')`

# 4.1.0
* Fix: apply pre hook before checking for emptiness

# 4.0.0
## Breaking changes
* Drop support for node 0.12 and 4

## Other changes
* Added: pre and post hooks to `typedef()`

# 3.7.1
* Changed: do not depend on Buffer to check base64 string

# 3.7.0
* Added: `parseArgs` callback for `registerTaggedType`, called to pre-process tag arguments into extra

# 3.6.1
* Fixed: use isFinite instead of Number.isFinite to support IE

# 3.6.0
* Added: `context.registerObjectType` to be used by core types in order to support IE

# 3.5.1
* Fixed: use isNaN instead of Number.isNaN to support IE

# 3.5.0
* Added: `Field#toJSONSchema()` that returns a parsed schema encoded in the [JSON Schema](http://json-schema.org/) standard

# 3.4.0
* Added: `'numeric'`, `'numericInt'`, `'numericUint'` and `'numericIn'` core types. Those are string equivalents of `Number`, `'int'`, `'uint'`, `'numberIn'` types

# 3.3.1
* Fixed: NaN, Infinity and -Infinity being accepted as numbers [issue #11](https://github.com/clubedaentrega/validate-fields/issues/11)

# 3.3.0
* Added: `'base64'`
* Fixed: `'hex'` does not accept an odd number of bytes

# 3.2.1
* Fixed: message for `number(min,max)`, `int(min,max)`, `uint(min,max)`

# 3.2.0
* Added: json type `'raw'` (like `'*'`, but don't call toJSON)

# 3.1.0
* Added: remove extraneous keys with `undefined` value in strict mode. Now `validate({}, {a: undefined}, {strict: true})` is `true`

# 3.0.0
## Breaking changes
* `validate({a: [String]}, {a: []})` now returns `true`

## Issues closed
*  Changed: do not consider empty array as an empty value [issue #9](https://github.com/clubedaentrega/validate-fields/issues/9) [pull #10](https://github.com/clubedaentrega/validate-fields/pull/10)

# 2.1.0
* Changed: `toJSON` is called when present, so now `validate(new Date, Date)` is `true`.

# 2.0.0
## Breaking changes
* You must use `var validate = require('validate-fields')()` instead of old `var validate = require('validate-fields')` (note the `()` at the end).
* `validate(String, '')` now returns `true` instead of `false`
* `validate({'a?': Number}, {a: ''})` now returns `false` instead of `true`

## Issues closed
* Added: default values [issue #3](https://github.com/clubedaentrega/validate-fields/issues/3)
* Changed: new definition of emptiness [issue #2](https://github.com/clubedaentrega/validate-fields/issues/2) [pull #5](https://github.com/clubedaentrega/validate-fields/pull/5)
* Changed: removed empty check from other places than hash [issue #8](https://github.com/clubedaentrega/validate-fields/issues/8)
* Changed: no more global registry, create contexts instead [issue #7](https://github.com/clubedaentrega/validate-fields/issues/7)

# 1.4.0
* Added: new numeric types [issue #1](https://github.com/clubedaentrega/validate-fields/issues/1)
* Fixed: array is accepted as object [issue #4](https://github.com/clubedaentrega/validate-fields/issues/4)
* Added: give support for tagged types [issue #6](https://github.com/clubedaentrega/validate-fields/issues/6)

# 1.3.0
* Added: better error reporting (lastErrorPath, lastErrorMessage)
* Added: type '*'
* Added: strict option

# 1.2.0
* Added: toJSON and from JSON support
* Fixed: to exact-length string rule
* Fixed: to null-prototyped objects