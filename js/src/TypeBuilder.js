var Builder, NamedFunction, Null, Property, Shape, TypeBuilder, TypeRegistry, assert, assertType, assertTypes, combine, define, emptyFunction, guard, isConstructor, mergeDefaults, setKind, setType, sync, throwFailure;

throwFailure = require("failure").throwFailure;

NamedFunction = require("NamedFunction");

emptyFunction = require("emptyFunction");

mergeDefaults = require("mergeDefaults");

isConstructor = require("isConstructor");

assertTypes = require("assertTypes");

assertType = require("assertType");

Property = require("Property");

Builder = require("Builder");

setKind = require("setKind");

setType = require("setType");

combine = require("combine");

assert = require("assert");

define = require("define");

Shape = require("Shape");

guard = require("guard");

Null = require("Null");

sync = require("sync");

TypeRegistry = require("./TypeRegistry");

module.exports = TypeBuilder = NamedFunction("TypeBuilder", function(name, func) {
  var self;
  self = Builder(name, func);
  setType(self, TypeBuilder);
  if (name) {
    TypeRegistry.register(name, self);
  }
  TypeBuilder.props.define(self, arguments);
  return self;
});

setKind(TypeBuilder, Builder);

TypeBuilder.props = Property.Map({
  _initArguments: function() {
    return [];
  },
  _argumentTypes: null,
  _argumentDefaults: null,
  _optionTypes: null,
  _optionDefaults: null,
  _getCacheID: null,
  _getExisting: null
});

define(TypeBuilder.prototype, {
  argumentTypes: {
    get: function() {
      return this._argumentTypes;
    },
    set: function(argumentTypes) {
      var keys, typeList;
      assert(!this._argumentTypes, "'argumentTypes' is already defined!");
      assertType(argumentTypes, [Array, Object]);
      argumentTypes = sync.map(argumentTypes, function(type) {
        if (!isConstructor(type, Object)) {
          return type;
        }
        return Shape(type);
      });
      this._argumentTypes = argumentTypes;
      this._didBuild.push(function(type) {
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
      return this._willBuild.push(function() {
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
      this._didBuild.push(function(type) {
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
        var i, index, len, name, value;
        for (index = i = 0, len = argumentNames.length; i < len; index = ++i) {
          name = argumentNames[index];
          if (args[index] !== void 0) {
            continue;
          }
          value = argumentDefaults[name];
          if (isConstructor(value, Object)) {
            args[index] = combine(args[index], value);
          } else {
            args[index] = value;
          }
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
      this._didBuild.push(function(type) {
        return type.optionTypes = optionTypes;
      });
      if (!this._optionDefaults) {
        this.createArguments(this.__createOptions);
      }
      if (!isDev) {
        return;
      }
      return this._willBuild.push(function() {
        return this.initArguments(function(args) {
          assertTypes(args[0], optionTypes);
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
      this._didBuild.push(function(type) {
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
  },
  createArguments: function(func) {
    assertType(func, Function);
    this._initArguments.unshift(func);
  },
  initArguments: function(func) {
    assertType(func, Function);
    this._initArguments.push(function(args) {
      func.call(null, args);
      return args;
    });
  },
  returnCached: function(func) {
    assertType(func, Function);
    this._getCacheID = func;
    this._didBuild.push(function(type) {
      return type.cache = Object.create(null);
    });
  },
  returnExisting: function(func) {
    assertType(func, Function);
    this._getExisting = func;
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
  __buildArgumentCreator: function() {
    var phases;
    phases = this._initArguments;
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
        args = phase.call(null, args);
        assert(Array.isArray(args), {
          args: args,
          phase: phase,
          reason: "Must return an Array of arguments!"
        });
      }
      return args;
    };
  },
  __buildInstanceCreator: function() {
    var createInstance, getCacheID, getExisting;
    createInstance = Builder.prototype.__buildInstanceCreator.call(this);
    getCacheID = this._getCacheID;
    if (getCacheID) {
      return function(type, args) {
        var id, instance;
        id = getCacheID.apply(null, args);
        if (id === void 0) {
          return createInstance(type, args);
        }
        instance = type.cache[id];
        if (instance) {
          return instance;
        }
        return type.cache[id] = createInstance(type, args);
      };
    }
    getExisting = this._getExisting;
    if (getExisting) {
      return function(type, args) {
        var instance;
        instance = getExisting.apply(null, args);
        if (instance) {
          return instance;
        }
        return createInstance(type, args);
      };
    }
    return createInstance;
  }
});

//# sourceMappingURL=../../map/src/TypeBuilder.map
