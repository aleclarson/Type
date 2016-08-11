var TypeTuple, Validator, isType, wrongType;

Validator = require("Validator");

wrongType = require("wrongType");

isType = require("isType");

TypeTuple = Validator.Type("TypeTuple", {
  init: function(types) {
    return this.types = types;
  },
  name: function() {
    return formatType(this.types);
  },
  test: function(value) {
    return isType(value, this.types);
  },
  assert: function(value, key) {
    if (isType(value, this.types)) {
      return;
    }
    return wrongType(this.types, key);
  }
});

module.exports = TypeTuple;

//# sourceMappingURL=map/TypeTuple.map
