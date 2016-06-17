
{ throwFailure } = require "failure"

NamedFunction = require "NamedFunction"
emptyFunction = require "emptyFunction"
mergeDefaults = require "mergeDefaults"
isConstructor = require "isConstructor"
assertTypes = require "assertTypes"
assertType = require "assertType"
Property = require "Property"
Builder = require "Builder"
setKind = require "setKind"
setType = require "setType"
hasKeys = require "hasKeys"
combine = require "combine"
isType = require "isType"
assert = require "assert"
define = require "define"
Shape = require "Shape"
guard = require "guard"
Null = require "Null"
Void = require "Void"
sync = require "sync"
has = require "has"

TypeRegistry = require "./TypeRegistry"

module.exports =
TypeBuilder = NamedFunction "TypeBuilder", (name, func) ->

  self = Builder name, func

  setType self, TypeBuilder

  TypeRegistry.register name, self if name

  TypeBuilder.props.define self, arguments

  return self

setKind TypeBuilder, Builder

TypeBuilder.props = Property.Map

  _initArguments: -> []

  _argumentTypes: null

  _argumentDefaults: null

  _options: null

  _optionTypes: null

  _optionDefaults: null

  _getCacheID: null

  _getExisting: null

define TypeBuilder.prototype,

  optionTypes:
    get: -> @_optionTypes
    set: (optionTypes) ->

      assert not @_options, "Cannot set 'optionTypes' after calling 'defineOptions'!"
      assert not @_optionTypes, "'optionTypes' is already defined!"

      assertType optionTypes, Object

      @_optionTypes = optionTypes

      @_didBuild.push (type) ->
        type.optionTypes = optionTypes

      if not @_optionDefaults
        @_initArguments.unshift (args) ->
          args[0] = {} if args[0] is undefined
          assertType args[0], Object, "options"
          return args

      return if not isDev

      # Option validation occurs after
      # the options have been initialized!
      @_willBuild.push -> @initArguments (args) ->
        assertTypes args[0], optionTypes
        return args

  optionDefaults:
    get: -> @_optionDefaults
    set: (optionDefaults) ->

      assert not @_options, "Cannot set 'optionDefaults' after calling 'defineOptions'!"
      assert not @_optionDefaults, "'optionDefaults' is already defined!"

      assertType optionDefaults, Object

      @_optionDefaults = optionDefaults

      @_didBuild.push (type) ->
        type.optionDefaults = optionDefaults

      if not @_optionTypes
        @_initArguments.unshift (args) ->
          args[0] = {} if args[0] is undefined
          assertType args[0], Object, "options"
          return args

      # Merging default option values occurs
      # after the options have been created,
      # but before the options are validated!
      @_initArguments.push (args) ->
        mergeDefaults args[0], optionDefaults
        return args

  defineOptions: (argIndex, optionConfigs) ->

    assert not @_optionTypes, "Cannot call 'defineOptions' after setting 'optionTypes'!"
    assert not @_optionDefaults, "Cannot call 'defineOptions' after setting 'optionDefaults'!"

    if arguments.length is 1
      optionConfigs = argIndex
      argIndex = 0

    assertType argIndex, Number
    assertType optionConfigs, Object

    if @_options
      assert not @_options[argIndex], "Already called 'defineOptions' with an 'argIndex' equal to #{argIndex}!"
    else @_options = []

    @_options[argIndex] = optionConfigs

    optionTypes = {}
    optionDefaults = {}

    sync.each optionConfigs, (optionConfig, optionName) ->

      # Support { key: type }
      if not isType optionConfig, Object
        optionTypes[optionName] = optionConfig
        return

      # Support { key: { default: value } }
      if has optionConfig, "default"
        optionDefaults[optionName] = optionConfig.default

      # Support { key: { defaults: values } }
      else if has optionConfig, "defaults"
        optionDefaults[optionName] = optionConfig.defaults

      # Support { key: { type: func } }
      if optionType = optionConfig.type

        # Support { key: { required: bool } }
        if not optionConfig.required
          if Array.isArray optionType
            optionType = optionType.concat Void
          else optionType = optionType.Maybe or [ optionType, Void ]

        optionTypes[optionName] = optionType

      return

    @_didBuild.push (type) ->
      type.optionTypes = optionTypes if hasKeys optionTypes
      type.optionDefaults = optionDefaults if hasKeys optionDefaults

    createOptions = (args) ->

      options = args[argIndex]

      if options is undefined
        args[argIndex] = options = {}

      assertType args[0], Object, "options"

      for optionName, optionConfig of optionConfigs

        option = options[optionName]

        if isType optionConfig.defaults, Object
          options[optionName] = option = {} if not isType option, Object
          mergeDefaults option, optionConfig.defaults

        else if option is undefined

          if has optionConfig, "default"
            options[optionName] = option = optionConfig.default

          else if not optionConfig.required
            continue # Dont validate options that arent required.

        optionType = optionTypes[optionName]
        continue if not optionType

        if isType optionType, Object
          assertTypes option, optionType, "options." + optionName
        else assertType option, optionType, "options." + optionName

      return args

    @_initArguments.push createOptions

  argumentTypes:
    get: -> @_argumentTypes
    set: (argumentTypes) ->

      assert not @_argumentTypes, "'argumentTypes' is already defined!"

      assertType argumentTypes, [ Array, Object ]

      argumentTypes = sync.map argumentTypes, (type) ->
        return type if not isConstructor type, Object
        return Shape type

      @_argumentTypes = argumentTypes

      @_didBuild.push (type) ->
        type.argumentTypes = argumentTypes

      return if not isDev

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
      @_willBuild.push -> @initArguments (args) ->
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

      @_didBuild.push (type) ->
        type.argumentDefaults = argumentDefaults

      if Array.isArray argumentDefaults
        @_initArguments.unshift (args) ->
          for value, index in argumentDefaults
            continue if args[index] isnt undefined
            if isConstructor value, Object
              args[index] = combine args[index], value
            else args[index] = value
          return args
        return

      # Merging default argument values occurs
      # after the arguments have been created,
      # but before the arguments are validated!
      argumentNames = Object.keys @_argumentTypes
      @_initArguments.push (args) ->
        for name, index in argumentNames
          continue if args[index] isnt undefined
          value = argumentDefaults[name]
          if isConstructor value, Object
            args[index] = combine args[index], value
          else args[index] = value
        return args
      return

  createArguments: (func) ->
    assertType func, Function
    @_initArguments.unshift func
    return

  initArguments: (func) ->
    assertType func, Function
    @_initArguments.push (args) ->
      func.call null, args
      return args
    return

  returnCached: (func) ->
    assertType func, Function
    @_getCacheID = func
    @_didBuild.push (type) ->
      type.cache = Object.create null
      return
    return

  returnExisting: (func) ->
    assertType func, Function
    @_getExisting = func
    return

define TypeBuilder.prototype,

  __buildArgumentCreator: ->

    phases = @_initArguments

    if phases.length is 0
      return emptyFunction.thatReturnsArgument

    return (initialArgs) ->
      args = [] # The 'initialArgs' should not be leaked.
      args.push arg for arg in initialArgs
      for phase in phases
        args = phase.call null, args
        assert Array.isArray(args), { args, phase, reason: "Must return an Array of arguments!" }
      return args

  __buildInstanceCreator: ->

    createInstance = Builder::__buildInstanceCreator.call this

    getCacheID = @_getCacheID
    if getCacheID
      return (type, args) ->
        id = getCacheID.apply null, args
        return createInstance type, args if id is undefined
        instance = type.cache[id]
        return instance if instance
        return type.cache[id] = createInstance type, args

    getExisting = @_getExisting
    if getExisting
      return (type, args) ->
        instance = getExisting.apply null, args
        return instance if instance
        return createInstance type, args

    return createInstance
