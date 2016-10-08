
{frozen} = require "Property"

NamedFunction = require "NamedFunction"
emptyFunction = require "emptyFunction"
assertType = require "assertType"
Builder = require "Builder"
setKind = require "setKind"
setType = require "setType"
hasKeys = require "hasKeys"
isType = require "isType"
define = require "define"
Shape = require "Shape"
isDev = require "isDev"
sync = require "sync"
bind = require "bind"

TypeBuilder = NamedFunction "TypeBuilder", (name) ->
  self = Builder name
  self._phases.args = []
  return setType self, TypeBuilder

module.exports = setKind TypeBuilder, Builder

define TypeBuilder,

  _stringifyTypes: (types) ->
    JSON.stringify types

define TypeBuilder.prototype,

  defineArgs: (args) ->
    assertType args, Object

    if @_hasArgs
    then throw Error "'defineArgs' must only be called once!"
    else frozen.define this, "_hasArgs", {value: yes}

    argNames = []
    argTypes = {}
    argDefaults = {}
    requiredTypes = {}

    sync.each args, (arg, name) ->

      argNames.push name

      if not isType arg, Object
        argTypes[name] = arg
        return

      if arg.default isnt undefined
        argDefaults[name] = arg.default

      if argType = arg.type

        if isType argType, Object
          argType = Shape argType

        if arg.required
          requiredTypes[name] = yes

        argTypes[name] = argType

    @_phases.args.push validateArgs = (args) ->

      for name, index in argNames
        arg = args[index]

        if arg is undefined

          if argDefaults[name] isnt undefined
            args[index] = arg = argDefaults[name]

          else if not requiredTypes[name]
            continue

        if isDev and argType = argTypes[name]
          argType and assertType arg, argType, "args[#{index}]"

      return args

    @didBuild (type) ->

      if hasKeys argTypes
        type.argTypes = argTypes
        frozen.define argTypes, "toString",
          value: -> TypeBuilder._stringifyTypes argTypes
          enumerable: no

      if hasKeys argDefaults
        type.argDefaults = argDefaults

    return

  initArgs: (func) ->
    assertType func, Function

    initArgs = (args) ->
      func.call this, args
      return args

    isDev and initArgs = bind.toString func, initArgs
    @_phases.args.push initArgs
    return

  replaceArgs: (replaceArgs) ->
    assertType replaceArgs, Function

    if isDev
      @_phases.args.push bind.toString replaceArgs, (args) ->
        args = replaceArgs.call this, args
        return args if args and typeof args.length is "number"
        throw TypeError "Must return an array-like object!"
      return

    @_phases.args.push replaceArgs
    return

  defineOptions: (optionConfigs) ->
    assertType optionConfigs, Object

    if @_hasOptions
    then throw Error "'defineOptions' must only be called once!"
    else frozen.define this, "_hasOptions", {value: yes}

    optionNames = []
    optionTypes = {}
    optionDefaults = {}
    requiredTypes = {}

    sync.each optionConfigs, (option, name) ->

      optionNames.push name

      if not isType option, Object
        optionTypes[name] = option
        return

      if option.default isnt undefined
        optionDefaults[name] = option.default

      if optionType = option.type

        if isType optionType, Object
          optionType = Shape optionType

        if option.required
          requiredTypes[name] = yes

        optionTypes[name] = optionType

    @_phases.args.push validateOptions = (args) ->

      if not options = args[0]
        args[0] = options = {}

      assertType options, Object, "options"

      for name in optionNames
        option = options[name]

        if option is undefined

          if optionDefaults[name] isnt undefined
            options[name] = option = optionDefaults[name]

          else if not requiredTypes[name]
            continue

        if isDev and optionType = optionTypes[name]
          optionType and assertType option, optionType, "options." + name

      return args

    @didBuild (type) ->

      if hasKeys optionTypes
        type.optionTypes = optionTypes
        frozen.define optionTypes, "toString",
          value: -> TypeBuilder._stringifyTypes optionTypes
          enumerable: no

      if hasKeys optionDefaults
        type.optionDefaults = optionDefaults

    return

define TypeBuilder.prototype,

  __createArgBuilder: ->

    argPhases = @_phases.args

    if argPhases.length is 0
      return emptyFunction.thatReturnsArgument

    return buildArgs = (initialArgs, context) ->

      args = new Array initialArgs.length

      for arg, i in initialArgs
        args[i] = arg

      for phase in argPhases
        args = phase.call context, args

      return args
