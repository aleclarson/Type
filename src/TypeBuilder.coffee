
{frozen} = require "Property"

NamedFunction = require "NamedFunction"
emptyFunction = require "emptyFunction"
assertType = require "assertType"
sliceArray = require "sliceArray"
Arguments = require "Arguments"
Builder = require "Builder"
setKind = require "setKind"
setType = require "setType"
Either = require "Either"
isType = require "isType"
define = require "define"
isDev = require "isDev"

TypeBuilder = NamedFunction "TypeBuilder", (name) ->
  self = Builder name
  return setType self, TypeBuilder

module.exports = setKind TypeBuilder, Builder

define TypeBuilder.prototype,

  createArgs: (callback) ->
    @_phases.push "args", callback
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

    @_phases.push "args", (values) ->
      values = args.initialize values
      if isDev
        error = args.validate values
        throw error if error
      return values if args.isArray
      return [values]
    return

define TypeBuilder.prototype,

  __createArgBuilder: ->

    unless @_phases.has "args"
      return emptyFunction.thatReturnsArgument

    callbacks = @_phases.get "args"
    return buildArgs = (args, context) ->
      args = sliceArray args
      for callback in callbacks
        args = callback.call context, args
      return args

#
# Helpers
#

createArguments = (config) ->
  assertType config, Object
  args = Arguments.Builder()

  config.types ?=
    if isType config.defaults, Object
    then {}
    else []

  for key, value of config
    value? and args.set key, value

  return args.build()
