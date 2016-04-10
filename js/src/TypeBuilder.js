var Builder, NamedFunction, TypeBuilder, assert, assertType, becomeFunction, define, initBaseObject, initTypeCount, instanceID, instanceType, ref, registerTypeName, registeredTypeNames, setKind, setType, trackInstanceType;

ref = require("type-utils"), assert = ref.assert, assertType = ref.assertType, setType = ref.setType, setKind = ref.setKind;

NamedFunction = require("NamedFunction");

define = require("define");

Builder = require("./Builder");

module.exports = TypeBuilder = NamedFunction("TypeBuilder", function(name, func) {
  var self;
  assertType(name, String);
  self = Builder();
  setType(self, TypeBuilder);
  define(self, {
    enumerable: false
  }, {
    _name: name,
    _optionTypes: null,
    _optionDefaults: null
  });
  becomeFunction(self, func);
  self._typePhases.push(initTypeCount);
  self._willCreate = trackInstanceType;
  self._initPhases.push(initBaseObject);
  return self;
});

setKind(TypeBuilder, Builder);

define(TypeBuilder, {
  __allowDuplicateNames: function() {
    var registerTypeName;
    return registerTypeName = emptyFunction;
  }
});

define(TypeBuilder.prototype, {
  inherits: function(kind) {
    assertType(kind, [Function.Kind, Null]);
    this._kind = kind;
    if (kind === Object) {
      this._createInstance = function() {
        return {};
      };
      return;
    }
    if (kind === null) {
      this._createInstance = function() {
        return Object.create(null);
      };
      return;
    }
    this._createInstance = function(args) {
      return kind.apply(null, args);
    };
  },
  optionTypes: {
    get: function() {
      return this._optionTypes;
    },
    set: function(optionTypes) {
      assert(!this._optionTypes, "'optionTypes' is already defined!");
      assertType(optionTypes, Object);
      this._optionTypes = optionTypes;
      this._typePhases.push(function() {
        return this.optionTypes = optionTypes;
      });
      return this._argPhases.push(function(args) {
        if (args[0] === void 0) {
          args[0] = {};
        }
        assertType(args[0], Object, "options");
        validateTypes(args[0], optionTypes);
        return args;
      });
    }
  },
  optionDefaults: {
    get: function() {
      return this._optionDefaults;
    },
    set: function(optionTypes) {
      assert(!this._optionDefaults, "'optionDefaults' is already defined!");
      assertType(optionDefaults, Object);
      this._optionDefaults = optionDefaults;
      this._typePhases.push(function() {
        return this.optionDefaults = optionDefaults;
      });
      return this._argPhases.push(function(args) {
        if (args[0] === void 0) {
          args[0] = {};
        }
        assertType(args[0], Object, "options");
        return mergeDefaults(args[0], optionDefaults);
      });
    }
  },
  construct: function() {
    return this.finalize().apply(null, arguments);
  },
  __createType: function(type) {
    registerTypeName(this._name);
    type = NamedFunction(this._name, type);
    setKind(type, this._kind);
    return type;
  }
});

instanceType = null;

instanceID = null;

registeredTypeNames = Object.create(null);

registerTypeName = function(name) {
  assert(!registeredTypeNames[name], "A type named '" + name + "' already exists!");
  return registeredTypeNames[name] = true;
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

initTypeCount = function(type) {
  return type.count = 0;
};

trackInstanceType = function(type) {
  console.log("BEFORE trackInstanceType: " + (instanceType != null ? instanceType.getName() : void 0));
  if (instanceType) {
    return;
  }
  instanceType = type;
  instanceID = type.count++;
  return console.log("AFTER trackInstanceType: " + (instanceType != null ? instanceType.getName() : void 0));
};

initBaseObject = function() {
  console.log("initBaseObject: " + (instanceType != null ? instanceType.getName() : void 0));
  if (!instanceType) {
    return;
  }
  setType(this, instanceType);
  define(this, "__name", {
    enumerable: false,
    get: function() {
      return this.constructor.getName() + "_" + this.__id;
    }
  });
  define(this, "__id", {
    enumerable: false,
    frozen: true,
    value: instanceID
  });
  instanceType = null;
  return instanceID = null;
};

//# sourceMappingURL=../../map/src/TypeBuilder.map
