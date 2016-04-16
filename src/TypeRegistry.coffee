
{ assert } = require "type-utils"

registry = Object.create null

module.exports =

  isEnabled: yes

  register: (name) ->
    return unless @isEnabled
    assert not registry[name], "A type named '#{name}' already exists!"
    registry[name] = yes
