var NamedFunction, Tracer, Type, ValidationMixin, Validator, define, setKind, setType;

require("isDev");

NamedFunction = require("NamedFunction");

Validator = require("Validator");

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

[Validator, Validator.Type].forEach(function(type) {
  return setType(type, Type);
});

[Array, Boolean, Number, RegExp, String, Symbol, Function, Object, Error, Date].forEach(function(type) {
  return define(type, ValidationMixin);
});

//# sourceMappingURL=map/Type.map
