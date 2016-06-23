var assert, registry;

require("isDev");

assert = require("assert");

registry = Object.create(null);

module.exports = {
  isEnabled: true,
  register: function(name, builder) {
    if (!this.isEnabled) {
      return;
    }
    assert(!registry[name], function() {
      var stack, value;
      value = registry[name];
      if (isDev) {
        stack = [builder._tracer()];
        if (value) {
          stack.push(value._tracer());
        }
      }
      return {
        reason: "A type named '" + name + "' already exists!",
        stack: stack,
        value: value,
        newValue: builder
      };
    });
    return registry[name] = builder;
  }
};

//# sourceMappingURL=../../map/src/TypeRegistry.map
