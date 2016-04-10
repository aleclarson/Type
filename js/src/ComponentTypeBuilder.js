var Builder, Type, type;

Builder = require("./Builder");

Type = require("./Type");

type = Type("ComponentTypeBuilder", function() {
  var self;
  self = Builder();
  return define(self, {
    enumerable: false
  }, {
    _propTypes: null,
    _propDefaults: null
  });
});

type.inherits(Builder);

type.definePrototype({
  propTypes: {
    get: function() {
      return this._propTypes;
    },
    set: function(propTypes) {}
  }
});

module.exports = type.build();

//# sourceMappingURL=../../map/src/ComponentTypeBuilder.map
