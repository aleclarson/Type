
{ Kind
  Maybe
  setType
  setKind
  assertType } = require "type-utils"

NamedFunction = require "NamedFunction"
define = require "define"

Builder = require "./Builder"

module.exports =
Type = NamedFunction "Type", (name, func) ->

  type = Type.Builder name, func

  type._typePhases.push (type) ->
    Type.augment type

  return type

setKind Type, Function

define Type,

  Builder: require "./TypeBuilder"

  augment: (type, inheritable) ->
    type.Maybe = Maybe type
    type.Kind = Kind type if inheritable isnt no
    setType type, Type

#
# Builtin Types
#

for type in [ Number, String, Boolean, Symbol, Array, Date, RegExp ]
  Type.augment type, no

for type in [ Object, Function, Error, Type, Type.Builder, Builder ]
  Type.augment type
