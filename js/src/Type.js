var Builder, Kind, Maybe, NamedFunction, Property, Tracer, Type, assertType, define, i, j, len, len1, ref, ref1, setKind, setType, type;

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

module.exports = Type = NamedFunction("Type", function(name, func) {
  var self;
  self = Type.Builder(name, func);
  self._tracer = Tracer("Type()", {
    skip: 1
  });
  self.didBuild(function(type) {
    return Type.augment(type, true);
  });
  return self;
});

setKind(Type, Function);

define(Type, {
  Builder: require("./TypeBuilder"),
  augment: function(type, inheritable) {
    var prop;
    prop = Property({
      frozen: true,
      enumerable: false
    });
    prop.define(type, "Maybe", Maybe(type));
    if (inheritable) {
      prop.define(type, "Kind", Kind(type));
    }
    return setType(type, Type);
  }
});

ref = [Number, String, Boolean, Symbol, Array, Date, RegExp];
for (i = 0, len = ref.length; i < len; i++) {
  type = ref[i];
  Type.augment(type);
}

ref1 = [Object, Function, Error, Type, Type.Builder, Builder];
for (j = 0, len1 = ref1.length; j < len1; j++) {
  type = ref1[j];
  Type.augment(type, true);
}

//# sourceMappingURL=../../map/src/Type.map
