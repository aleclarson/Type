
require "isDev"

NamedFunction = require "NamedFunction"
formatType = require "formatType"
assertType = require "assertType"
sliceArray = require "sliceArray"
Validator = require "Validator"
Property = require "Property"
Builder = require "Builder"
setKind = require "setKind"
setType = require "setType"
Tracer = require "tracer"
define = require "define"
Maybe = require "Maybe"
Kind = require "Kind"

TypeTuple = require "./TypeTuple"

Type = NamedFunction "Type", (name, func) ->
  self = Type.Builder name, func
  isDev and self._tracer = Tracer "Type()", skip: 1
  self.didBuild (type) -> Type.augment type, yes
  return self

module.exports = setKind Type, Function

define Type::,

  or: Validator::or = ->
    types = sliceArray arguments
    types.unshift this
    return TypeTuple types

  isRequired: get: ->
    type: this
    required: yes

  withDefault: (value) ->
    type: this
    default: value

define Type,

  Builder: require "./TypeBuilder"

  Tuple: TypeTuple

  augment: (type, inheritable) ->

    prop = Property { frozen: yes, enumerable: no }

    prop.define type, "Maybe", { value: Maybe type }

    if inheritable
      prop.define type, "Kind", { value: Kind type }

    return setType type, Type

#
# Builtin Types
#

[ Array
  Boolean
  Date
  Number
  RegExp
  String
  Symbol
].forEach (type) ->
  Type.augment type

[ Object
  Function
  Error
  Type
  Type.Builder
  Builder
].forEach (type) ->
  Type.augment type, yes
