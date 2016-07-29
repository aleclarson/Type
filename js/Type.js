var Builder, Kind, Maybe, NamedFunction, Property, Tracer, Type, assertType, define, setKind, setType;

require("isDev");

NamedFunction = require("NamedFunction");

assertType = require("assertType");

Property = require("Property");

Builder = require("Builder");

setKind = require("setKind");

setType = require("setType");

Tracer = require("tracer");

define = require("define");

Maybe = require("Maybe");

Kind = require("Kind");

Type = NamedFunction("Type", function(name, func) {
  var self;
  self = Type.Builder(name, func);
  isDev && (self._tracer = Tracer("Type()", {
    skip: 1
  }));
  self.didBuild(function(type) {
    return Type.augment(type, true);
  });
  return self;
});

module.exports = setKind(Type, Function);

define(Type.prototype, {
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
  }
});

define(Type, {
  Builder: require("./TypeBuilder"),
  augment: function(type, inheritable) {
    var prop;
    prop = Property({
      frozen: true,
      enumerable: false
    });
    prop.define(type, "Maybe", {
      value: Maybe(type)
    });
    if (inheritable) {
      prop.define(type, "Kind", {
        value: Kind(type)
      });
    }
    return setType(type, Type);
  }
});

[Array, Boolean, Date, Number, RegExp, String, Symbol].forEach(function(type) {
  return Type.augment(type);
});

[Object, Function, Error, Type, Type.Builder, Builder].forEach(function(type) {
  return Type.augment(type, true);
});

//# sourceMappingURL=map/Type.map
