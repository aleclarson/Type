var Kind, Maybe, Typle, frozen, sliceArray;

frozen = require("Property").frozen;

sliceArray = require("sliceArray");

Typle = require("Typle");

Maybe = require("Maybe");

Kind = require("Kind");

module.exports = {
  isRequired: {
    get: function() {
      return {
        type: this,
        required: true
      };
    }
  },
  withDefault: function(value) {
    return {
      type: this,
      "default": value
    };
  },
  or: function() {
    var types;
    types = sliceArray(arguments);
    types.unshift(this);
    return Typle(types);
  },
  Maybe: {
    get: function() {
      var value;
      value = Maybe(this);
      frozen.define(this, "Maybe", {
        value: value
      });
      return value;
    }
  },
  Kind: {
    get: function() {
      var value;
      value = Kind(this);
      frozen.define(this, "Kind", {
        value: value
      });
      return value;
    }
  }
};

//# sourceMappingURL=map/ValidationMixin.map
