
{ setType, assertType } = require "type-utils"

Property = require "Property"

# These reflect the instance being built.
instanceType = null
instanceID = null

props =

  name: Property
    get: -> @constructor.getName() + "_" + @__id
    frozen: yes
    enumerable: no

  id: Property
    frozen: yes
    enumerable: no

module.exports = (func) ->
  becomeFunction this, func
  @_willCreate = willCreate
  @_didCreate = didCreate
  @_phases.initType.push initType

initType = (type) ->
  type.count = 0

willCreate = (type) ->
  return if instanceType
  instanceType = type
  instanceID = type.count++

didCreate = ->

  return unless instanceType

  # The base object has its type set to `instanceType`
  # so we can override methods used in init phases!
  setType this, instanceType

  props.name.define this, "__name"
  props.id.define this, "__id", instanceID

  instanceType = null
  instanceID = null
  return

becomeFunction = (type, func) ->
  return if func is undefined
  assertType func, Function
  type._kind = Function
  type._createInstance = ->
    self = -> func.apply self, arguments
