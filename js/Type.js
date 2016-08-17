var Builder, NamedFunction, Tracer, Type, ValidationMixin, Validator, define, setKind, setType;

require("isDev");

NamedFunction = require("NamedFunction");

Validator = require("Validator");

Builder = require("Builder");

setKind = require("setKind");

setType = require("setType");

Tracer = require("tracer");

define = require("define");

ValidationMixin = require("./ValidationMixin");

Type = NamedFunction("Type", function(name, func) {
  var self;
  self = Type.Builder(name, func);
  isDev && (self._tracer = Tracer("Type()", {
    skip: 1
  }));
  self.didBuild(function(type) {
    return setType(type, Type);
  });
  return self;
});

module.exports = setKind(Type, Function);

Type.Builder = require("./TypeBuilder");

define(Type.prototype, ValidationMixin);

define(Validator.prototype, ValidationMixin);

[Array, Boolean, Date, Number, RegExp, String, Symbol, Object, Function, Error, Type, Type.Builder, Builder, Validator, Validator.Type].forEach(function(type) {
  return setType(type, Type);
});

//# sourceMappingURL=map/Type.map
