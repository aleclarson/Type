
Validator = require "Validator"
wrongType = require "wrongType"
isType = require "isType"

TypeTuple = Validator.Type "TypeTuple",

  init: (types) ->
    @types = types

  name: -> formatType @types

  test: (value) -> isType value, @types

  assert: (value, key) ->
    return if isType value, @types
    return wrongType @types, key

module.exports = TypeTuple
