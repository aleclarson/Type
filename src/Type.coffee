
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

Type = NamedFunction "Type", (name, func) ->

  self = Type.Builder name, func

  self._tracer = Tracer "Type()", skip: 1

  self.didBuild (type) ->
    Type.augment type, yes

  return self

module.exports = setKind Type, Function

define Type.prototype,

  isRequired: get: ->
    { type: this, required: yes }

  withDefault: (value) ->
    { type: this, default: value }

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
