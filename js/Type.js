// Generated by CoffeeScript 1.12.4
var NamedFunction, Type, becomeType, setKind, setType;

NamedFunction = require("NamedFunction");

setKind = require("setKind");

setType = require("setType");

Type = NamedFunction("Type", function(name) {
  var self;
  self = Type.Builder(name);
  self.didBuild(becomeType);
  return self;
});

module.exports = setKind(Type, Function);

becomeType = function(type) {
  return setType(type, Type);
};
