var BaseObject, Builder, NamedFunction, Null, Override, Property, Tracer, TypeBuilder, TypeRegistry, assert, assertType, define, emptyFunction, guard, mergeDefaults, ref, setKind, setType, sync, throwFailure, validateTypes;

ref = require("type-utils"), Null = ref.Null, assert = ref.assert, assertType = ref.assertType, validateTypes = ref.validateTypes, setType = ref.setType, setKind = ref.setKind;

throwFailure = require("failure").throwFailure;

emptyFunction = require("emptyFunction");

NamedFunction = require("NamedFunction");

mergeDefaults = require("mergeDefaults");

Property = require("Property");

Override = require("override");

Builder = require("Builder");

Tracer = require("tracer");

define = require("define");

guard = require("guard");

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
  BaseObject.initialize(self, func);
  return self;
});

setKind(TypeBuilder, Builder);

TypeBuilder.props = Property.Map({
  _traceInit: function() {
    return Tracer("TypeBuilder()", {
      skip: 2
    });
  },
  _name: function(name) {
    TypeRegistry.register(name, this);
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
      this.didBuild(function(type) {
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
      return this.willBuild(function() {
        return this.initArguments(function(args) {
          var i, index, len, type;
          for (index = i = 0, len = typeList.length; i < len; index = ++i) {
            type = typeList[index];
            assertType(args[index], type, keys[index]);
          }
          return args;
        });
      });
    }
  },
  argumentDefaults: {
    get: function() {
      return this._argumentDefaults;
    },
    set: function(argumentDefaults) {
      var argumentNames;
      assert(this._argumentTypes, "'argumentTypes' must be defined first!");
      assert(!this._argumentDefaults, "'argumentDefaults' is already defined!");
      assertType(argumentDefaults, [Array, Object]);
      this._argumentDefaults = argumentDefaults;
      this.didBuild(function(type) {
        return type.argumentDefaults = argumentDefaults;
      });
      if (Array.isArray(argumentDefaults)) {
        this.createArguments(function(args) {
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
      argumentNames = Object.keys(this._argumentTypes);
      this.initArguments(function(args) {
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
      this.didBuild(function(type) {
        return type.optionTypes = optionTypes;
      });
      if (!this._optionDefaults) {
        this.createArguments(this.__createOptions);
      }
      if (!isDev) {
        return;
      }
      return this.willBuild(function() {
        return this.initArguments(function(args) {
          validateTypes(args[0], optionTypes);
          return args;
        });
      });
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
      this.didBuild(function(type) {
        return type.optionDefaults = optionDefaults;
      });
      if (!this._optionTypes) {
        this.createArguments(this.__createOptions);
      }
      return this.initArguments(function(args) {
        mergeDefaults(args[0], optionDefaults);
        return args;
      });
    }
  }
});

define(TypeBuilder.prototype, {
  inherits: function(kind) {
    assertType(kind, [Function.Kind, Null]);
    assert(!this._kind, {
      builder: this,
      kind: kind,
      reason: "'kind' is already defined!"
    });
    this._kind = kind;
    this.willBuild(function() {
      var builder;
      if (this._createInstance) {
        return;
      }
      if (kind === null) {
        this._createInstance = function() {
          return Object.create(null);
        };
        return;
      }
      builder = this;
      return this._createInstance = function(args) {
        return guard(function() {
          return kind.apply(null, args);
        }).fail(function(error) {
          return throwFailure(error, {
            type: builder._cachedBuild,
            kind: kind,
            args: args
          });
        });
      };
    });
  },
  createArguments: function(fn) {
    assertType(fn, Function);
    this._phases.initArguments.unshift(fn);
  },
  initArguments: function(fn) {
    assertType(fn, Function);
    this._phases.initArguments.push(function(args) {
      fn(args);
      return args;
    });
  },
  returnCached: function(fn) {
    assertType(fn, Function);
    this._getCacheID = fn;
    this.didBuild(function(type) {
      return type.cache = Object.create(null);
    });
  },
  returnExisting: function(fn) {
    assertType(fn, Function);
    this._getExisting = fn;
  },
  overrideMethods: function(overrides) {
    var func, key, kind, methods, name;
    assertType(overrides, Object);
    assert(this._kind, "'kind' must be defined first!");
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
    return this.didBuild(function(type) {
      Override.augment(type);
      return define(type.prototype, methods);
    });
  }
});

define(TypeBuilder.prototype, {
  build: function() {
    var args;
    args = arguments;
    return guard((function(_this) {
      return function() {
        return Builder.prototype.build.apply(_this, args);
      };
    })(this)).fail((function(_this) {
      return function(error) {
        var stack;
        if (isDev) {
          stack = _this._traceInit();
        }
        return throwFailure(error, {
          stack: stack
        });
      };
    })(this));
  },
  __createOptions: function(args) {
    if (args[0] === void 0) {
      args[0] = {};
    }
    assertType(args[0], Object, "options");
    return args;
  },
  __createType: function(type) {
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
  __createConstructor: function(createInstance) {
    return BaseObject.createConstructor(createInstance);
  },
  __wrapConstructor: function() {
    var createInstance, getCacheId, getExisting;
    createInstance = Builder.prototype.__wrapConstructor.apply(this, arguments);
    getCacheId = this._getCacheID;
    if (getCacheId) {
      return function(type, args) {
        var id, self;
        id = getCacheId.apply(null, args);
        if (id !== void 0) {
          self = type.cache[id];
          if (self === void 0) {
            self = createInstance(type, args);
            type.cache[id] = self;
          }
        } else {
          self = createInstance(type, args);
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
        return createInstance(type, args);
      };
    }
    return createInstance;
  }
});

//# sourceMappingURL=../../map/src/TypeBuilder.map
