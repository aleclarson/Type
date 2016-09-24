
NamedFunction = require "NamedFunction"
Validator = require "Validator"
setKind = require "setKind"
setType = require "setType"
Tracer = require "tracer"
define = require "define"
isDev = require "isDev"

ValidationMixin = require "./ValidationMixin"

Type = NamedFunction "Type", (name, func) ->
  self = Type.Builder name, func
  isDev and self._tracer = Tracer "Type()", skip: 1
  self.didBuild (type) -> setType type, Type
  return self

module.exports = setKind Type, Function

Type.Builder = require "./TypeBuilder"

define Type::, ValidationMixin
define Validator::, ValidationMixin

[ Validator
  Validator.Type
]
.forEach (type) ->
  setType type, Type

[ Array
  Boolean
  Number
  RegExp
  String
  Symbol
  Function
  Object
  Error
  Date
]
.forEach (type) ->
  define type, ValidationMixin
