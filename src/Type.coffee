
NamedFunction = require "NamedFunction"
setKind = require "setKind"
setType = require "setType"

Type = NamedFunction "Type", (name) ->
  self = Type.Builder name
  self.didBuild becomeType
  return self

module.exports = setKind Type, Function

becomeType = (type) ->
  setType type, Type
