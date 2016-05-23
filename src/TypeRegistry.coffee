
require "isDev"

assert = require "assert"

registry = Object.create null

module.exports =

  isEnabled: yes

  register: (name, builder) ->

    return unless @isEnabled

    assert not registry[name], ->

      value = registry[name]
      if isDev
        stack = [ builder._tracer() ]
        stack.push value._tracer() if value

      reason: "A type named '#{name}' already exists!"
      stack: stack
      value: value
      newValue: builder

    registry[name] = builder
