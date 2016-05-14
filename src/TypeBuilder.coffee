
{ throwFailure } = require "failure"

NamedFunction = require "NamedFunction"
emptyFunction = require "emptyFunction"
mergeDefaults = require "mergeDefaults"
isConstructor = require "isConstructor"
assertTypes = require "assertTypes"
assertType = require "assertType"
Property = require "Property"
Override = require "override"
Builder = require "Builder"
setKind = require "setKind"
setType = require "setType"
combine = require "combine"
assert = require "assert"
define = require "define"
Shape = require "Shape"
guard = require "guard"
Null = require "Null"
sync = require "sync"

TypeRegistry = require "./TypeRegistry"
BaseObject = require "./BaseObject"

module.exports =
TypeBuilder = NamedFunction "TypeBuilder", (name, func) ->

  self = Builder()

  self._phases.initArguments = []

  setType self, TypeBuilder

  TypeBuilder.props.define self, arguments

  BaseObject.initialize self, func

  return self

setKind TypeBuilder, Builder

TypeBuilder.props = Property.Map

  _name: (name) ->
    TypeRegistry.register name, this if name
    return name or ""

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

      argumentTypes = sync.map argumentTypes, (type) ->
        return type if not isConstructor type, Object
        return Shape type

      @_argumentTypes = argumentTypes

      @didBuild (type) ->
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

      # Argument validation occurs after
      # the arguments have been initialized!
      @willBuild -> @initArguments (args) ->
        for type, index in typeList
          assertType args[index], type, keys[index]
        return args

  argumentDefaults:
    get: -> @_argumentDefaults
    set: (argumentDefaults) ->

      assert @_argumentTypes, "'argumentTypes' must be defined first!"
      assert not @_argumentDefaults, "'argumentDefaults' is already defined!"

      assertType argumentDefaults, [ Array, Object ]

      @_argumentDefaults = argumentDefaults

      @didBuild (type) ->
        type.argumentDefaults = argumentDefaults

      if Array.isArray argumentDefaults
        @createArguments (args) ->
          for value, index in argumentDefaults
            continue if args[index] isnt undefined
            args[index] = value
          return args
        return

      # Merging default argument values occurs
      # after the arguments have been created,
      # but before the arguments are validated!
      argumentNames = Object.keys @_argumentTypes
      @initArguments (args) ->
        for name, index in argumentNames
          continue if args[index] isnt undefined
          value = argumentDefaults[name]
          if isConstructor value, Object
            args[index] = combine args[index], value
          else args[index] = value
        return args
      return

  optionTypes:
    get: -> @_optionTypes
    set: (optionTypes) ->

      assert not @_optionTypes, "'optionTypes' is already defined!"

      assertType optionTypes, Object

      @_optionTypes = optionTypes

      @didBuild (type) ->
        type.optionTypes = optionTypes

      unless @_optionDefaults
        @createArguments @__createOptions

      return unless isDev

      # Option validation occurs after
      # the options have been initialized!
      @willBuild -> @initArguments (args) ->
        assertTypes args[0], optionTypes
        return args

  optionDefaults:
    get: -> @_optionDefaults
    set: (optionDefaults) ->

      assert not @_optionDefaults, "'optionDefaults' is already defined!"

      assertType optionDefaults, Object

      @_optionDefaults = optionDefaults

      @didBuild (type) ->
        type.optionDefaults = optionDefaults

      unless @_optionTypes
        @createArguments @__createOptions

      # Merging default option values occurs
      # after the options have been created,
      # but before the options are validated!
      @initArguments (args) ->
        mergeDefaults args[0], optionDefaults
        return args

define TypeBuilder.prototype,

  inherits: (kind) ->

    assertType kind, [ Function.Kind, Null ]
    assert not @_kind, { builder: this, kind, reason: "'kind' is already defined!" }

    @_kind = kind

    # Allow types to override the default 'createInstance'.
    @willBuild ->

      return if @_createInstance

      if kind is null
        @_createInstance = -> Object.create null
        return

      builder = this
      @_createInstance = (args) ->
        guard -> kind.apply null, args
        .fail (error) -> throwFailure error, { type: builder._cachedBuild, kind, args }

    return

  createArguments: (fn) ->
    assertType fn, Function
    @_phases.initArguments.unshift fn
    return

  initArguments: (fn) ->
    assertType fn, Function
    @_phases.initArguments.push (args) ->
      fn args
      return args
    return

  returnCached: (fn) ->
    assertType fn, Function
    @_getCacheID = fn
    @didBuild (type) ->
      type.cache = Object.create null
    return

  returnExisting: (fn) ->
    assertType fn, Function
    @_getExisting = fn
    return

  overrideMethods: (overrides) ->

    assertType overrides, Object
    assert @_kind, "'kind' must be defined first!"

    name = @_name
    kind = @_kind

    methods = {}
    for key, func of overrides
      assertType func, Function, name + "::" + key
      methods[key] = Override { key, kind, func }

    @didBuild (type) ->
      Override.augment type
      define type.prototype, methods

define TypeBuilder.prototype,

  build: ->
    args = arguments
    guard => Builder::build.apply this, args
    .fail (error) =>
      stack = @_traceInit() if isDev
      throwFailure error, { stack }

  __createOptions: (args) ->
    args[0] = {} if args[0] is undefined
    assertType args[0], Object, "options"
    return args

  __createType: (type) ->
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
        args = phase.call null, args
        assert Array.isArray(args), { args, phase, reason: "Must return an Array of arguments!" }
      return args

  __createConstructor: (createInstance) ->
    BaseObject.createConstructor createInstance

  __wrapConstructor: ->

    createInstance = Builder::__wrapConstructor.apply this, arguments

    getCacheId = @_getCacheID
    if getCacheId
      return (type, args) ->
        id = getCacheId.apply null, args
        if id isnt undefined
          self = type.cache[id]
          if self is undefined
            self = createInstance type, args
            type.cache[id] = self
        else self = createInstance type, args
        return self

    getExisting = @_getExisting
    if getExisting
      return (type, args) ->
        self = getExisting.apply null, args
        return self if self isnt undefined
        return createInstance type, args

    return createInstance
