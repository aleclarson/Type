
NamedFunction = require "NamedFunction"
Validator = require "Validator"
Property = require "Property"
setKind = require "setKind"
Builder = require "Builder"
setType = require "setType"
Tracer = require "tracer"
isType = require "isType"
OneOf = require "OneOf"
isDev = require "isDev"
sync = require "sync"

Type = NamedFunction "Type", (name, func) ->
  self = Type.Builder name, func
  isDev and self._tracer = Tracer "Type()", skip: 1
  self.didBuild (type) -> setType type, Type
  return self

module.exports = setKind Type, Function

Type.Mixin = Builder.Mixin

Type.Builder = require "./TypeBuilder"

# On each target, define the following validation helpers:
#   - isRequired      equal to {type: Number, required: true}
#   - withDefault     equal to {type: Number, default: 100}
#   - or(types...)    creates a validator that allows the given types
#   - Maybe           validator that allows undefined
#   - Kind            validator that uses `instanceof`
targets = [
  Type::
  Validator::
  Function
  Object
  Array
  String
  Boolean
  Number
  RegExp
  Date
  Error
  Symbol
]

# Don't define `Kind` on these targets.
noKind = OneOf [
  Array
  String
  Boolean
  Number
  RegExp
  Date
  Symbol
]

ValidationMixin = require "./ValidationMixin"

sync.each ValidationMixin, (config, key) ->

  prop =
    if isType config, Object
    then Property config
    else Property {value: config}

  # Avoid clogging object inspection.
  isDev and prop.hidden = yes

  if key is "Kind"
    for target in targets
      if not noKind.test target
        prop.define target, key
    return

  for target in targets
    prop.define target, key
  return
