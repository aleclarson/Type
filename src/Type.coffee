
require "isDev"

NamedFunction = require "NamedFunction"
Validator = require "Validator"
Builder = require "Builder"
setKind = require "setKind"
setType = require "setType"
Tracer = require "tracer"
define = require "define"

ValidationMixin = require "./ValidationMixin"

Type = NamedFunction "Type", (name, func) ->
  self = Type.Builder name, func
  isDev and self._tracer = Tracer "Type()", skip: 1
  self.didBuild (type) -> setType type, Type
  return self

module.exports = setKind Type, Function

Type.Builder = require "./TypeBuilder"

#
# Add validation helpers to the
# prototypes of `Type` and `Validator`.
#
define Type::, ValidationMixin
define Validator::, ValidationMixin

#
# Set the `__proto__` of each built-in type
# to force inheritance of the `Type` class.
#
[ Array
  Boolean
  Date
  Number
  RegExp
  String
  Symbol
  Object
  Function
  Error
  Type
  Type.Builder
  Builder
  Validator
  Validator.Type ].forEach (type) -> setType type, Type
