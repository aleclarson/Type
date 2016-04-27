
{ Null, assert, assertType, validateTypes, setType, setKind } = require "type-utils"

emptyFunction = require "emptyFunction"
NamedFunction = require "NamedFunction"
mergeDefaults = require "mergeDefaults"
Property = require "Property"
Override = require "override"
Builder = require "Builder"
define = require "define"
sync = require "sync"

TypeRegistry = require "./TypeRegistry"
BaseObject = require "./BaseObject"

module.exports =
TypeBuilder = NamedFunction "TypeBuilder", (name, func) ->

  assertType name, String

  self = Builder()

  self._phases.initArguments = []

  setType self, TypeBuilder

  TypeBuilder.props.define self, arguments

  BaseObject.call self, func

  return self

setKind TypeBuilder, Builder

TypeBuilder.props = Property.Map

  _name: (name) -> name

  _argumentTypes: null

  _argumentDefaults: null

  _optionTypes: null

  _optionDefaults: null

  _getCacheID: null

  _getExisting: null

  argumentTypes:
    get: -> @_argumentTypes
    set: (argumentTypes) ->

      assert not @_argumentTypes, "'argumentTypes' is already defined!"

      assertType argumentTypes, [ Array, Object ]

      @_argumentTypes = argumentTypes

      @_phases.initType.push (type) ->
        type.argumentTypes = argumentTypes

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

  argumentDefaults:
    get: -> @_argumentDefaults
    set: (argumentDefaults) ->

      assert not @_argumentDefaults, "'argumentDefaults' is already defined!"

      assertType argumentDefaults, [ Array, Object ]

      @_argumentDefaults = argumentDefaults

      @_phases.initType.push (type) ->
        type.argumentDefaults = argumentDefaults

      if Array.isArray argumentDefaults
        @_phases.initArguments.unshift (args) ->
          for value, index in argumentDefaults
            continue if args[index] isnt undefined
            args[index] = value
          return args
        return

      argumentNames = Object.keys argumentDefaults
      @_phases.initArguments.unshift (args) ->
        for name, index in argumentNames
          continue if args[index] isnt undefined
          args[index] = argumentDefaults[name]
        return args
      return

  optionTypes:
    get: -> @_optionTypes
    set: (optionTypes) ->

      assert not @_optionTypes, "'optionTypes' is already defined!"

      assertType optionTypes, Object

      @_optionTypes = optionTypes

      unless @_optionDefaults
        @createArguments @__createOptions

      if isDev

        @_phases.initArguments.push (args) ->
          validateTypes args[0], optionTypes
          return args

        @_phases.initType.push (type) ->
          type.optionTypes = optionTypes

  optionDefaults:
    get: -> @_optionDefaults
    set: (optionDefaults) ->

      assert not @_optionDefaults, "'optionDefaults' is already defined!"

      assertType optionDefaults, Object

      @_optionDefaults = optionDefaults

      unless @_optionTypes
        @createArguments @__createOptions

      @_phases.initArguments.unshift (args) ->
        mergeDefaults args[0], optionDefaults
        return args

      @_phases.initType.push (type) ->
        type.optionDefaults = optionDefaults

define TypeBuilder.prototype,

  construct: ->
    @build().apply null, arguments

  inherits: (kind) ->

    assertType kind, [ Function.Kind, Null ]

    @_kind = kind

    if kind is null
      @_createInstance = -> Object.create null
      return

    @_createInstance = (args) -> kind.apply null, args
    return

  createArguments: (createArguments) ->
    assertType createArguments, Function
    @_phases.build.push ->
      @_phases.initArguments.unshift createArguments
    return

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

  overrideMethods: (overrides) ->

    assertType overrides, Object

    name = @_name
    kind = @_kind

    methods = {}
    for key, func of overrides
      assertType func, Function, name + "::" + key
      methods[key] = Override { key, kind, func }

    @_phases.initType.push (type) ->
      Override.augment type
      define type.prototype, methods

define TypeBuilder.prototype,

  __createOptions: (args) ->
    args[0] = {} if args[0] is undefined
    assertType args[0], Object, "options"
    return args

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
