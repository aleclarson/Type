
{frozen} = require "Property"

sliceArray = require "sliceArray"
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
    types = sliceArray arguments
    types.unshift this
    return Typle types

  # Pass undefined values.
  Maybe: get: ->
    value = Maybe this
    frozen.define this, "Maybe", {value}
    return value

  # Pass values that inherit the expected type.
  Kind: get: ->
    value = Kind this
    frozen.define this, "Kind", {value}
    return value
