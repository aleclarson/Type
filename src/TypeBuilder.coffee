
{frozen} = require "Property"

NamedFunction = require "NamedFunction"
emptyFunction = require "emptyFunction"
assertType = require "assertType"
Arguments = require "Arguments"
Builder = require "Builder"
setKind = require "setKind"
setType = require "setType"
Either = require "Either"
isType = require "isType"
define = require "define"
isDev = require "isDev"
sync = require "sync"

TypeBuilder = NamedFunction "TypeBuilder", (name) ->
  self = Builder name
  self._phases.args = []
  return setType self, TypeBuilder

module.exports = setKind TypeBuilder, Builder

define TypeBuilder.prototype,

  createArgs: (create) ->
    @_phases.args.push create
    return

  defineArgs: (config) ->

    throw Error "Cannot call 'defineArgs' more than once!" if @_args

    assertType config, Either(Function, Object, Array)

    args =
      if isType config, Function
      then createArguments config()
      else Arguments config

    frozen.define this, "_args", {value: args}

    unless args.isArray
      @defineStatics
        optionTypes: {value: args.types}

    @_phases.args.push (values) ->
      values = args.initialize values
      if isDev
        error = args.validate values
        throw error if error
      return values if args.isArray
      return [values]
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

#
# Helpers
#

createArguments = (config) ->
  assertType config, Object
  args = Arguments.Builder()
  for key, value of config
    value? and args.set key, value
  return args.build()
