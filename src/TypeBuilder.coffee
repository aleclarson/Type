
{ assert, assertType, setType, setKind } = require "type-utils"

NamedFunction = require "NamedFunction"
define = require "define"

Builder = require "./Builder"

module.exports =
TypeBuilder = NamedFunction "TypeBuilder", (name, func) ->

  assertType name, String

  self = Builder()

  setType self, TypeBuilder

  define self, { enumerable: no },
    _name: name
    _optionTypes: null
    _optionDefaults: null

  becomeFunction self, func

  self._typePhases.push initTypeCount

  self._willCreate = trackInstanceType

  self._initPhases.push initBaseObject

  return self

setKind TypeBuilder, Builder

define TypeBuilder,

  # Convenience method for testing.
  __allowDuplicateNames: ->
    registerTypeName = emptyFunction

define TypeBuilder.prototype,

  inherits: (kind) ->

    assertType kind, [ Function.Kind, Null ]

    @_kind = kind

    if kind is Object
      @_createInstance = -> {}
      return

    if kind is null
      @_createInstance = -> Object.create null
      return

    @_createInstance = (args) -> kind.apply null, args
    return

  optionTypes:
    get: -> @_optionTypes
    set: (optionTypes) ->

      assert not @_optionTypes, "'optionTypes' is already defined!"

      assertType optionTypes, Object

      @_optionTypes = optionTypes

      @_typePhases.push ->
        @optionTypes = optionTypes

      @_argPhases.push (args) ->
        args[0] = {} if args[0] is undefined
        assertType args[0], Object, "options"
        validateTypes args[0], optionTypes
        return args

  optionDefaults:
    get: -> @_optionDefaults
    set: (optionTypes) ->

      assert not @_optionDefaults, "'optionDefaults' is already defined!"

      assertType optionDefaults, Object

      @_optionDefaults = optionDefaults

      @_typePhases.push ->
        @optionDefaults = optionDefaults

      @_argPhases.push (args) ->
        args[0] = {} if args[0] is undefined
        assertType args[0], Object, "options"
        return mergeDefaults args[0], optionDefaults

  construct: ->
    @finalize().apply null, arguments

  __createType: (type) ->
    registerTypeName @_name
    type = NamedFunction @_name, type
    setKind type, @_kind
    return type

#
# Helpers
#

# These reflect the instance being built.
instanceType = null
instanceID = null

# Prevent types with the same name.
registeredTypeNames = Object.create null
registerTypeName = (name) ->
  assert not registeredTypeNames[name], "A type named '#{name}' already exists!"
  registeredTypeNames[name] = yes

becomeFunction = (type, func) ->
  return if func is undefined
  assertType func, Function
  type._kind = Function
  type._createInstance = ->
    self = -> func.apply self, arguments

initTypeCount = (type) ->
  type.count = 0

trackInstanceType = (type) ->
  console.log "BEFORE trackInstanceType: " + instanceType?.getName()
  return if instanceType
  instanceType = type
  instanceID = type.count++
  console.log "AFTER trackInstanceType: " + instanceType?.getName()

initBaseObject = ->

  console.log "initBaseObject: " + instanceType?.getName()

  return unless instanceType

  # The base object has its type set to `instanceType`
  # so we can override methods used in init phases!
  setType this, instanceType

  define this, "__name",
    enumerable: no
    get: -> @constructor.getName() + "_" + @__id

  define this, "__id",
    enumerable: no
    frozen: yes
    value: instanceID

  instanceType = null
  instanceID = null
