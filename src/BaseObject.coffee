
assertType = require "assertType"
Property = require "Property"
setType = require "setType"

# These reflect the instance being built.
instanceType = null
instanceID = null

module.exports = mixin =

  initialize: (type, func) ->

    type.didBuild mixin.didBuild

    if func isnt undefined
      assertType func, Function
      type._kind = Function
      type._createInstance = ->
        instance = -> func.apply instance, arguments

    return

  didBuild: (type) ->
    type.count = 0

  createConstructor: (createInstance) ->

    return (type, args) ->

      unless instanceType
        instanceType = type
        instanceID = type.count++

      instance = createInstance.call null, args

      if instanceType

        # The base object has its type set to `instanceType`
        # so we can override methods used in init phases!
        setType instance, instanceType

        props.name.define instance, "__name"
        props.id.define instance, "__id", instanceID

        instanceType = null
        instanceID = null

      return instance

props =

  name: Property
    get: -> @constructor.getName() + "_" + @__id
    frozen: yes
    enumerable: no

  id: Property
    frozen: yes
    enumerable: no
