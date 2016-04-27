var BaseObject, Builder, NamedFunction, Null, Override, Property, TypeBuilder, TypeRegistry, assert, assertType, define, emptyFunction, mergeDefaults, ref, setKind, setType, sync, validateTypes;

ref = require("type-utils"), Null = ref.Null, assert = ref.assert, assertType = ref.assertType, validateTypes = ref.validateTypes, setType = ref.setType, setKind = ref.setKind;

emptyFunction = require("emptyFunction");

NamedFunction = require("NamedFunction");

mergeDefaults = require("mergeDefaults");

Property = require("Property");

Override = require("override");

Builder = require("Builder");

define = require("define");

sync = require("sync");

TypeRegistry = require("./TypeRegistry");

BaseObject = require("./BaseObject");

module.exports = TypeBuilder = NamedFunction("TypeBuilder", function(name, func) {
  var self;
  assertType(name, String);
  self = Builder();
  self._phases.initArguments = [];
  setType(self, TypeBuilder);
  TypeBuilder.props.define(self, arguments);
  BaseObject.call(self, func);
  return self;
});

setKind(TypeBuilder, Builder);

TypeBuilder.props = Property.Map({
  _name: function(name) {
    return name;
  },
  _argumentTypes: null,
  _argumentDefaults: null,
  _optionTypes: null,
  _optionDefaults: null,
  _getCacheID: null,
  _getExisting: null,
  argumentTypes: {
    get: function() {
      return this._argumentTypes;
    },
    set: function(argumentTypes) {
      var keys, typeList;
      assert(!this._argumentTypes, "'argumentTypes' is already defined!");
      assertType(argumentTypes, [Array, Object]);
      this._argumentTypes = argumentTypes;
      this._phases.initType.push(function(type) {
        return type.argumentTypes = argumentTypes;
      });
      if (!isDev) {
        return;
      }
      if (Array.isArray(argumentTypes)) {
        keys = argumentTypes.map(function(_, index) {
          return "args[" + index + "]";
        });
        typeList = argumentTypes;
      } else {
        keys = Object.keys(argumentTypes);
        typeList = sync.reduce(argumentTypes, [], function(values, value) {
          values.push(value);
          return values;
        });
      }
      return this._phases.initArguments.push(function(args) {
        var i, index, len, type;
        for (index = i = 0, len = typeList.length; i < len; index = ++i) {
          type = typeList[index];
          assertType(args[index], type, keys[index]);
        }
        return args;
      });
    }
  },
  argumentDefaults: {
    get: function() {
      return this._argumentDefaults;
    },
    set: function(argumentDefaults) {
      var argumentNames;
      assert(!this._argumentDefaults, "'argumentDefaults' is already defined!");
      assertType(argumentDefaults, [Array, Object]);
      this._argumentDefaults = argumentDefaults;
      this._phases.initType.push(function(type) {
        return type.argumentDefaults = argumentDefaults;
      });
      if (Array.isArray(argumentDefaults)) {
        this._phases.initArguments.unshift(function(args) {
          var i, index, len, value;
          for (index = i = 0, len = argumentDefaults.length; i < len; index = ++i) {
            value = argumentDefaults[index];
            if (args[index] !== void 0) {
              continue;
            }
            args[index] = value;
          }
          return args;
        });
        return;
      }
      argumentNames = Object.keys(argumentDefaults);
      this._phases.initArguments.unshift(function(args) {
        var i, index, len, name;
        for (index = i = 0, len = argumentNames.length; i < len; index = ++i) {
          name = argumentNames[index];
          if (args[index] !== void 0) {
            continue;
          }
          args[index] = argumentDefaults[name];
        }
        return args;
      });
    }
  },
  optionTypes: {
    get: function() {
      return this._optionTypes;
    },
    set: function(optionTypes) {
      assert(!this._optionTypes, "'optionTypes' is already defined!");
      assertType(optionTypes, Object);
      this._optionTypes = optionTypes;
      if (!this._optionDefaults) {
        this.createArguments(this.__createOptions);
      }
      if (isDev) {
        this._phases.initArguments.push(function(args) {
          validateTypes(args[0], optionTypes);
          return args;
        });
        return this._phases.initType.push(function(type) {
          return type.optionTypes = optionTypes;
        });
      }
    }
  },
  optionDefaults: {
    get: function() {
      return this._optionDefaults;
    },
    set: function(optionDefaults) {
      assert(!this._optionDefaults, "'optionDefaults' is already defined!");
      assertType(optionDefaults, Object);
      this._optionDefaults = optionDefaults;
      if (!this._optionTypes) {
        this.createArguments(this.__createOptions);
      }
      this._phases.initArguments.unshift(function(args) {
        mergeDefaults(args[0], optionDefaults);
        return args;
      });
      return this._phases.initType.push(function(type) {
        return type.optionDefaults = optionDefaults;
      });
    }
  }
});

define(TypeBuilder.prototype, {
  construct: function() {
    return this.build().apply(null, arguments);
  },
  inherits: function(kind) {
    assertType(kind, [Function.Kind, Null]);
    this._kind = kind;
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
  createArguments: function(createArguments) {
    assertType(createArguments, Function);
    this._phases.build.push(function() {
      return this._phases.initArguments.unshift(createArguments);
    });
  },
  returnCached: function(getCacheID) {
    assertType(getCacheID, Function);
    this._getCacheID = getCacheID;
    this._phases.initType.push(function(type) {
      return type.cache = Object.create(null);
    });
  },
  returnExisting: function(getExisting) {
    assertType(getExisting, Function);
    this._getExisting = getExisting;
  },
  overrideMethods: function(overrides) {
    var func, key, kind, methods, name;
    assertType(overrides, Object);
    name = this._name;
    kind = this._kind;
    methods = {};
    for (key in overrides) {
      func = overrides[key];
      assertType(func, Function, name + "::" + key);
      methods[key] = Override({
        key: key,
        kind: kind,
        func: func
      });
    }
    return this._phases.initType.push(function(type) {
      Override.augment(type);
      return define(type.prototype, methods);
    });
  }
});

define(TypeBuilder.prototype, {
  __createOptions: function(args) {
    if (args[0] === void 0) {
      args[0] = {};
    }
    assertType(args[0], Object, "options");
    return args;
  },
  __createType: function(type) {
    TypeRegistry.register(this._name);
    type = NamedFunction(this._name, type);
    setKind(type, this._kind);
    return type;
  },
  __createArgTransformer: function() {
    var phases;
    phases = this._phases.initArguments;
    if (phases.length === 0) {
      return emptyFunction.thatReturnsArgument;
    }
    return function(initialArgs) {
      var arg, args, i, j, len, len1, phase;
      args = [];
      for (i = 0, len = initialArgs.length; i < len; i++) {
        arg = initialArgs[i];
        args.push(arg);
      }
      for (j = 0, len1 = phases.length; j < len1; j++) {
        phase = phases[j];
        args = phase(args);
        assert(Array.isArray(args), "Must return an Array of arguments!");
      }
      return args;
    };
  },
  __createConstructor: function() {
    var constructor, getCacheId, getExisting;
    constructor = Builder.prototype.__createConstructor.call(this);
    getCacheId = this._getCacheID;
    if (getCacheId) {
      return function(type, args) {
        var id, self;
        id = getCacheId.apply(null, args);
        if (id !== void 0) {
          self = type.cache[id];
          if (self === void 0) {
            self = constructor(type, args);
            type.cache[id] = self;
          }
        } else {
          self = constructor(type, args);
        }
        return self;
      };
    }
    getExisting = this._getExisting;
    if (getExisting) {
      return function(type, args) {
        var self;
        self = getExisting.apply(null, args);
        if (self !== void 0) {
          return self;
        }
        return constructor(type, args);
      };
    }
    return constructor;
  }
});

//# sourceMappingURL=../../map/src/TypeBuilder.map
