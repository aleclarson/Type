
{ assert, assertType, setType, setKind } = require "type-utils"

NamedFunction = require "NamedFunction"
mergeDefaults = require "mergeDefaults"
Builder = require "builder"
define = require "define"
sync = require "sync"

TypeRegistry = require "./TypeRegistry"

module.exports =
TypeBuilder = NamedFunction "TypeBuilder", (name, func) ->

  assertType name, String

  self = Builder()

  setType self, TypeBuilder

  define self, { enumerable: no },
    _name: name
    _argumentTypes: null
    _optionTypes: null
    _optionDefaults: null
    _getCacheID: null
    _getExisting: null

  becomeFunction self, func

  self._willCreate = trackInstanceType
  self._phases.initInstance.push initBaseObject
  self._phases.initType.push initTypeCount
  self._phases.initArguments = []
  return self

setKind TypeBuilder, Builder

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

  createArguments: (createArguments) ->
    assertType createArguments, Function
    @_phases.initArguments.push createArguments
    return

  argumentTypes:
    get: -> @_argumentTypes
    set: (argumentTypes) ->

      assert not @_argumentTypes, "'argumentTypes' is already defined!"

      assertType argumentTypes, [ Array, Object ]

      @_argumentTypes = argumentTypes

      @_phases.initType.push ->
        @argumentTypes = argumentTypes

      return unless isDev

      if Array.isArray argumentTypes
        keys = argumentTypes.map (_, index) -> "args[#{index}]"
        typeList = argumentTypes

      else
        keys = Object.keys argumentTypes
        typeList = sync.reduce argumentTypes, [], (values, value) ->
          values.push value
          return values

      @_phases.initArguments.push (args) ->
        for type, index in typeList
          assertType args[index], type, keys[index]
        return args

  optionTypes:
    get: -> @_optionTypes
    set: (optionTypes) ->

      assert not @_optionTypes, "'optionTypes' is already defined!"

      assertType optionTypes, Object

      @_optionTypes = optionTypes

      @_phases.initType.push ->
        @optionTypes = optionTypes

      return unless isDev
      @_phases.initArguments.push (args) ->
        args[0] = {} if args[0] is undefined
        assertType args[0], Object, "options"
        validateTypes args[0], optionTypes
        return args

  optionDefaults:
    get: -> @_optionDefaults
    set: (optionDefaults) ->

      assert not @_optionDefaults, "'optionDefaults' is already defined!"

      assertType optionDefaults, Object

      @_optionDefaults = optionDefaults

      @_phases.initType.push ->
        @optionDefaults = optionDefaults

      @_phases.initArguments.push (args) ->
        args[0] = {} if args[0] is undefined
        assertType args[0], Object, "options"
        mergeDefaults args[0], optionDefaults
        return args

  returnCached: (getCacheID) ->
    assertType getCacheID, Function
    @_getCacheID = getCacheID
    @_phases.initType.push (type) ->
      type.cache = Object.create null
    return

  returnExisting: (getExisting) ->
    assertType getExisting, Function
    @_getExisting = getExisting
    return

  construct: ->
    @build().apply null, arguments

  __createType: (type) ->
    TypeRegistry.register @_name
    type = NamedFunction @_name, type
    setKind type, @_kind
    return type

  __createArgTransformer: ->

    phases = @_phases.initArguments

    if phases.length is 0
      return emptyFunction.thatReturnsArgument

    return (initialArgs) ->
      args = [] # The 'initialArgs' should not be leaked.
      args.push arg for arg in initialArgs
      for phase in phases
        args = phase args
        assert (Array.isArray args), "Must return an Array of arguments!"
      return args

  __createConstructor: ->

    constructor = Builder::__createConstructor.call this

    getCacheId = @_getCacheID
    if getCacheId
      return (type, args) ->
        id = getCacheId.apply null, args
        if id isnt undefined
          self = type.cache[id]
          if self is undefined
            self = constructor type, args
            type.cache[id] = self
        else self = constructor type, args
        return self

    getExisting = @_getExisting
    if getExisting
      return (type, args) ->
        self = getExisting.apply null, args
        return self if self isnt undefined
        return constructor type, args

    return constructor

#
# Helpers
#

# These reflect the instance being built.
instanceType = null
instanceID = null

becomeFunction = (type, func) ->
  return if func is undefined
  assertType func, Function
  type._kind = Function
  type._createInstance = ->
    self = -> func.apply self, arguments

initTypeCount = (type) ->
  type.count = 0

trackInstanceType = (type) ->
  return if instanceType
  instanceType = type
  instanceID = type.count++

initBaseObject = ->

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
