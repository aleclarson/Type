var assert, registry;

assert = require("type-utils").assert;

registry = Object.create(null);

module.exports = {
  isEnabled: true,
  register: function(name) {
    if (!this.isEnabled) {
      return;
    }
    assert(!registry[name], "A type named '" + name + "' already exists!");
    return registry[name] = true;
  }
};

//# sourceMappingURL=../../map/src/TypeRegistry.map
