var Property, assertType, becomeFunction, didCreate, initType, instanceID, instanceType, props, ref, setType, willCreate;

ref = require("type-utils"), setType = ref.setType, assertType = ref.assertType;

Property = require("Property");

instanceType = null;

instanceID = null;

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

module.exports = function(func) {
  becomeFunction(this, func);
  this._willCreate = willCreate;
  this._didCreate = didCreate;
  return this._phases.initType.push(initType);
};

initType = function(type) {
  return type.count = 0;
};

willCreate = function(type) {
  if (instanceType) {
    return;
  }
  instanceType = type;
  return instanceID = type.count++;
};

didCreate = function() {
  if (!instanceType) {
    return;
  }
  setType(this, instanceType);
  props.name.define(this, "__name");
  props.id.define(this, "__id", instanceID);
  instanceType = null;
  instanceID = null;
};

becomeFunction = function(type, func) {
  if (func === void 0) {
    return;
  }
  assertType(func, Function);
  type._kind = Function;
  return type._createInstance = function() {
    var self;
    return self = function() {
      return func.apply(self, arguments);
    };
  };
};

//# sourceMappingURL=../../map/src/BaseObject.map
