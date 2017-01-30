
{mutable} = require "Property"

Either = require "Either"
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

  # Allow values of a variety of types.
  or: ->
    value = Either this
    for arg in arguments
      value.types.push arg
    return value

  # Pass undefined values.
  Maybe: get: ->
    value = Maybe this
    mutable.define this, "Maybe",
      get: -> value
      enumerable: no
    return value

  # Pass values that inherit the expected type.
  Kind: get: ->
    value = Kind this
    mutable.define this, "Kind",
      get: -> value
      enumerable: no
    return value
