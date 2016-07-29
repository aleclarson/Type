var Property, assertType, instanceID, instanceType, mixin, props, setType;

assertType = require("assertType");

Property = require("Property");

setType = require("setType");

instanceType = null;

instanceID = null;

module.exports = mixin = {
  initialize: function(type, func) {
    type.didBuild(mixin.didBuild);
    if (func !== void 0) {
      assertType(func, Function);
      type._kind = Function;
      type._createInstance = function() {
        var instance;
        return instance = function() {
          return func.apply(instance, arguments);
        };
      };
    }
  },
  didBuild: function(type) {
    return type.count = 0;
  },
  createConstructor: function(createInstance) {
    return function(type, args) {
      var instance;
      if (!instanceType) {
        instanceType = type;
        instanceID = type.count++;
      }
      instance = createInstance.call(null, args);
      if (instanceType) {
        setType(instance, instanceType);
        props.name.define(instance, "__name");
        props.id.define(instance, "__id", instanceID);
        instanceType = null;
        instanceID = null;
      }
      return instance;
    };
  }
};

props = {
  name: Property({
    get: function() {
      return this.constructor.getName() + "_" + this.__id;
    },
    frozen: true,
    enumerable: false
  }),
  id: Property({
    frozen: true,
    enumerable: false
  })
};

//# sourceMappingURL=map/BaseObject.map
