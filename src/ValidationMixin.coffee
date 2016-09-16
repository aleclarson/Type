
{mutable} = require "Property"

cloneArgs = require "cloneArgs"
Typle = require "Typle"
Maybe = require "Maybe"
Kind = require "Kind"

#
# Provides a collection of static methods
# for creating type-specific Validators.
#
module.exports =

  # Supported by `defineOptions`, `defineArgs`, and `defineProps`.
  # Throws an error when the value is not the expected type.
  isRequired: get: ->
    type: this
    required: yes

  # Supported by `defineOptions`, `defineArgs`, and `defineProps`.
  # Uses the default value when the value is undefined.
  withDefault: (value) ->
    type: this
    default: value

  # Pass values of many types.
  or: ->
    types = cloneArgs arguments
    types.unshift this
    return Typle types

  # Pass undefined values.
  Maybe: get: ->
    value = Maybe this
    mutable.define this, "Maybe", get: -> value
    return value

  # Pass values that inherit the expected type.
  Kind: get: ->
    value = Kind this
    mutable.define this, "Kind", get: -> value
    return value
