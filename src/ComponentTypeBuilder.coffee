
Builder = require "./Builder"
Type = require "./Type"

type = Type "ComponentTypeBuilder", ->

  self = Builder()

  define self, { enumerable: no },
    _propTypes: null
    _propDefaults: null

type.inherits Builder

type.definePrototype

  propTypes:
    get: -> @_propTypes
    set: (propTypes) ->

module.exports = type.build()
