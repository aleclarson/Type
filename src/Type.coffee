
NamedFunction = require "NamedFunction"
assertType = require "assertType"
Property = require "Property"
Builder = require "Builder"
setKind = require "setKind"
setType = require "setType"
Tracer = require "tracer"
define = require "define"
Maybe = require "Maybe"
Kind = require "Kind"

module.exports =
Type = NamedFunction "Type", (name, func) ->

  self = Type.Builder name, func

  self._tracer = Tracer "Type()", skip: 1

  self.didBuild (type) ->
    Type.augment type, yes

  return self

setKind Type, Function

define Type,

  Builder: require "./TypeBuilder"

  augment: (type, inheritable) ->

    prop = Property { frozen: yes, enumerable: no }

    prop.define type, "Maybe", Maybe type

    if inheritable
      prop.define type, "Kind", Kind type

    return setType type, Type

#
# Builtin Types
#

for type in [ Number, String, Boolean, Symbol, Array, Date, RegExp ]
  Type.augment type

for type in [ Object, Function, Error, Type, Type.Builder, Builder ]
  Type.augment type, yes
