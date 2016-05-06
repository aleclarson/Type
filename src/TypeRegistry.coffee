
require "isDev"

{ assert } = require "type-utils"

registry = Object.create null

module.exports =

  isEnabled: yes

  register: (name, builder) ->

    return unless @isEnabled

    assert not registry[name], ->

      value = registry[name]
      if isDev
        stack = [ builder._traceInit() ]
        stack.push value._traceInit() if value

      reason: "A type named '#{name}' already exists!"
      stack: stack
      value: value
      newValue: builder

    registry[name] = builder
