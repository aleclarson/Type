
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
sync = require "sync"
bind = require "bind"

TypeBuilder = NamedFunction "TypeBuilder", (name) ->
  self = Builder name
  self._phases.args = []
  return setType self, TypeBuilder

module.exports = setKind TypeBuilder, Builder

define TypeBuilder.prototype,

  defineArgs: (args) ->
    assertType args, Object

    if @_argTypes
      throw Error "'defineArgs' must only be called once!"

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

    validateArgs = (args) ->
      for name, index in argNames
        arg = args[index]
        if arg is undefined
          if argDefaults[name] isnt undefined
            args[index] = arg = argDefaults[name]
          else if not requiredTypes[name]
            continue
        if isDev
          argType = argTypes[name]
          argType and assertType arg, argType, "args[#{index}]"
      return args

    frozen.define this, "_argTypes", {value: argTypes}
    @_phases.args.push validateArgs
    @didBuild (type) ->
      if hasKeys argTypes
        type.argTypes = argTypes
        overrideObjectToString argTypes, gatherTypeNames
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

    if @_optionTypes
      throw Error "'defineOptions' must only be called once!"

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

    validateOptions = (args) ->
      options = args[0]
      options or args[0] = options = {}
      assertType options, Object, "options"
      for name in optionNames
        option = options[name]
        if option is undefined
          if optionDefaults[name] isnt undefined
            options[name] = option = optionDefaults[name]
          else if not requiredTypes[name]
            continue
        if isDev
          optionType = optionTypes[name]
          optionType and assertType option, optionType, "options." + name
      return args

    frozen.define this, "_optionTypes", {value: optionTypes}

    @_phases.args.push validateOptions

    @didBuild (type) ->
      if hasKeys optionTypes
        type.optionTypes = optionTypes
        overrideObjectToString optionTypes, gatherTypeNames
      if hasKeys optionDefaults
        type.optionDefaults = optionDefaults
    return

define TypeBuilder.prototype,

  __createArgBuilder: ->

    argPhases = @_phases.args

    if argPhases.length is 0
      return emptyFunction.thatReturnsArgument

    return buildArgs = (context, initialArgs) ->

      args = new Array initialArgs.length

      for arg, i in initialArgs
        args[i] = arg

      for phase in argPhases
        args = phase.call context, args

      return args

#
# Helpers
#

overrideObjectToString = (obj, transform) ->
  define obj, "toString", value: ->
    log._format transform(obj), {unlimited: yes, colors: no}

gatherTypeNames = (type) ->

  if isType type, Object
    return sync.map type, gatherTypeNames

  if type.getName
    return type.getName()

  return type.name
