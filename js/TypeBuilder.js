var Builder, NamedFunction, Null, Property, Shape, TypeBuilder, Void, assert, assertType, assertTypes, combine, define, emptyFunction, gatherTypeNames, guard, has, hasKeys, isConstructor, isType, mergeDefaults, overrideObjectToString, setKind, setType, sync;

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

hasKeys = require("hasKeys");

combine = require("combine");

isType = require("isType");

assert = require("assert");

define = require("define");

Shape = require("Shape");

guard = require("guard");

Null = require("Null");

Void = require("Void");

sync = require("sync");

has = require("has");

TypeBuilder = NamedFunction("TypeBuilder", function(name, func) {
  var self;
  self = Builder(name, func);
  setType(self, TypeBuilder);
  TypeBuilder.props.define(self, arguments);
  return self;
});

module.exports = setKind(TypeBuilder, Builder);

TypeBuilder.props = Property.Map({
  _initArguments: function() {
    return [];
  },
  _argumentTypes: null,
  _argumentDefaults: null,
  _options: null,
  _optionTypes: null,
  _optionDefaults: null,
  _getCacheID: null,
  _getExisting: null
});

define(TypeBuilder.prototype, {
  optionTypes: {
    get: function() {
      return this._optionTypes;
    },
    set: function(optionTypes) {
      console.warn("DEPRECATED: (" + this._name + ") Use 'defineOptions' instead of 'optionTypes'!");
      assert(!this._options, "Cannot set 'optionTypes' after calling 'defineOptions'!");
      assert(!this._optionTypes, "'optionTypes' is already defined!");
      assertType(optionTypes, Object);
      this._optionTypes = optionTypes;
      this._didBuild.push(function(type) {
        type.optionTypes = optionTypes;
        return overrideObjectToString(optionTypes, gatherTypeNames);
      });
      if (!this._optionDefaults) {
        this._initArguments.unshift(function(args) {
          if (args[0] === void 0) {
            args[0] = {};
          }
          assertType(args[0], Object, "options");
          return args;
        });
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
      console.warn("DEPRECATED: (" + this._name + ") Use 'defineOptions' instead of 'optionDefaults'!");
      assert(!this._options, "Cannot set 'optionDefaults' after calling 'defineOptions'!");
      assert(!this._optionDefaults, "'optionDefaults' is already defined!");
      assertType(optionDefaults, Object);
      this._optionDefaults = optionDefaults;
      this._didBuild.push(function(type) {
        return type.optionDefaults = optionDefaults;
      });
      if (!this._optionTypes) {
        this._initArguments.unshift(function(args) {
          if (args[0] === void 0) {
            args[0] = {};
          }
          assertType(args[0], Object, "options");
          return args;
        });
      }
      return this._initArguments.push(function(args) {
        mergeDefaults(args[0], optionDefaults);
        return args;
      });
    }
  },
  defineOptions: function(argIndex, optionConfigs) {
    var createOptions, optionDefaults, optionTypes;
    assert(!this._optionTypes, "Cannot call 'defineOptions' after setting 'optionTypes'!");
    assert(!this._optionDefaults, "Cannot call 'defineOptions' after setting 'optionDefaults'!");
    if (arguments.length === 1) {
      optionConfigs = argIndex;
      argIndex = 0;
    }
    assertType(argIndex, Number);
    assertType(optionConfigs, Object);
    if (this._options) {
      assert(!this._options[argIndex], "Already called 'defineOptions' with an 'argIndex' equal to " + argIndex + "!");
    } else {
      this._options = [];
    }
    this._options[argIndex] = optionConfigs;
    optionTypes = {};
    optionDefaults = {};
    sync.each(optionConfigs, function(optionConfig, optionName) {
      var optionType;
      if (!isType(optionConfig, Object)) {
        optionTypes[optionName] = optionConfig;
        return;
      }
      if (has(optionConfig, "default")) {
        optionDefaults[optionName] = optionConfig["default"];
      } else if (has(optionConfig, "defaults")) {
        optionDefaults[optionName] = optionConfig.defaults;
      }
      if (optionType = optionConfig.type) {
        if (!optionConfig.required) {
          if (Array.isArray(optionType)) {
            optionType = optionType.concat(Void);
          } else {
            optionType = optionType.Maybe || [optionType, Void];
          }
        }
        optionTypes[optionName] = optionType;
      }
    });
    this._didBuild.push(function(type) {
      if (hasKeys(optionTypes)) {
        type.optionTypes = optionTypes;
        overrideObjectToString(optionTypes, gatherTypeNames);
      }
      if (hasKeys(optionDefaults)) {
        return type.optionDefaults = optionDefaults;
      }
    });
    createOptions = function(args) {
      var option, optionConfig, optionName, optionType, options;
      options = args[argIndex];
      if (options === void 0) {
        args[argIndex] = options = {};
      }
      assertType(options, Object, "options");
      for (optionName in optionConfigs) {
        optionConfig = optionConfigs[optionName];
        if (!optionConfig) {
          debugger;
        }
        option = options[optionName];
        if (optionConfig.defaults) {
          if (!isType(option, Object)) {
            options[optionName] = option = {};
          }
          mergeDefaults(option, optionConfig.defaults);
        } else if (option === void 0) {
          if (has(optionConfig, "default")) {
            options[optionName] = option = optionConfig["default"];
          } else if (!optionConfig.required) {
            continue;
          }
        }
        optionType = optionTypes[optionName];
        if (!optionType) {
          continue;
        }
        if (isType(optionType, Object)) {
          assertTypes(option, optionType, "options." + optionName);
        } else {
          assertType(option, optionType, "options." + optionName);
        }
      }
      return args;
    };
    return this._initArguments.push(createOptions);
  },
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
        type.argumentTypes = argumentTypes;
        return overrideObjectToString(argumentTypes, gatherTypeNames);
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
        this._initArguments.unshift(function(args) {
          var i, index, len, value;
          for (index = i = 0, len = argumentDefaults.length; i < len; index = ++i) {
            value = argumentDefaults[index];
            if (args[index] !== void 0) {
              continue;
            }
            if (isConstructor(value, Object)) {
              args[index] = combine(args[index], value);
            } else {
              args[index] = value;
            }
          }
          return args;
        });
        return;
      }
      argumentNames = Object.keys(this._argumentTypes);
      this._initArguments.push(function(args) {
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
      type.cache = Object.create(null);
    });
  },
  returnExisting: function(func) {
    assertType(func, Function);
    this._getExisting = func;
  }
});

define(TypeBuilder.prototype, {
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

overrideObjectToString = function(obj, transform) {
  return Object.defineProperty(obj, "toString", {
    value: function() {
      return log._format(transform(obj), {
        unlimited: true,
        colors: false
      });
    }
  });
};

gatherTypeNames = function(type) {
  if (isType(type, Object)) {
    return sync.map(type, gatherTypeNames);
  }
  if (type.getName) {
    return type.getName();
  }
  return type.name;
};

//# sourceMappingURL=map/TypeBuilder.map
