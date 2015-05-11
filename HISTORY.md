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