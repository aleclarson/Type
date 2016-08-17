var Builder, NamedFunction, Property, Shape, TypeBuilder, assertType, assertTypes, bind, combine, define, emptyFunction, gatherTypeNames, has, hasKeys, isConstructor, isType, mergeDefaults, overrideObjectToString, setKind, setType, sliceArray, sync;

NamedFunction = require("NamedFunction");

emptyFunction = require("emptyFunction");

mergeDefaults = require("mergeDefaults");

isConstructor = require("isConstructor");

assertTypes = require("assertTypes");

assertType = require("assertType");

sliceArray = require("sliceArray");

Property = require("Property");

Builder = require("Builder");

setKind = require("setKind");

setType = require("setType");

hasKeys = require("hasKeys");

combine = require("combine");

isType = require("isType");

define = require("define");

Shape = require("Shape");

sync = require("sync");

bind = require("bind");

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
  _argPhases: function() {
    return [];
  },
  _argTypes: null,
  _optionTypes: null,
  _getCacheID: null,
  _getExisting: null
});

define(TypeBuilder.prototype, {
  defineArgs: function(args) {
    var argDefaults, argNames, argTypes, requiredTypes, validateArgs;
    assertType(args, Object);
    if (this._argTypes) {
      throw Error("'defineArgs' must only be called once!");
    }
    argNames = [];
    argTypes = {};
    argDefaults = {};
    requiredTypes = {};
    sync.each(args, function(arg, name) {
      var argType;
      argNames.push(name);
      if (!isType(arg, Object)) {
        argTypes[name] = arg;
        return;
      }
      if (has(arg, "default")) {
        argDefaults[name] = arg["default"];
      }
      if (argType = arg.type) {
        if (isType(argType, Object)) {
          argType = Shape(argType);
        }
        if (arg.required) {
          requiredTypes[name] = true;
        }
        return argTypes[name] = argType;
      }
    });
    validateArgs = function(args) {
      var arg, argType, i, index, len, name;
      for (index = i = 0, len = argNames.length; i < len; index = ++i) {
        name = argNames[index];
        arg = args[index];
        if (arg === void 0) {
          if (argDefaults[name] !== void 0) {
            args[index] = arg = argDefaults[name];
          } else if (!requiredTypes[name]) {
            continue;
          }
        }
        if (isDev) {
          argType = argTypes[name];
          argType && assertType(arg, argType, "args[" + index + "]");
        }
      }
      return args;
    };
    this._argTypes = argTypes;
    this._argPhases.push(validateArgs);
    this.didBuild(function(type) {
      if (hasKeys(argTypes)) {
        type.argTypes = argTypes;
        overrideObjectToString(argTypes, gatherTypeNames);
      }
      if (hasKeys(argDefaults)) {
        return type.argDefaults = argDefaults;
      }
    });
  },
  initArgs: function(func) {
    var initArgs;
    assertType(func, Function);
    initArgs = function(args) {
      func.call(null, args);
      return args;
    };
    isDev && (initArgs = bind.toString(func, initArgs));
    this._argPhases.push(initArgs);
  },
  replaceArgs: function(func) {
    var replaceArgs;
    assertType(func, Function);
    replaceArgs = function(args) {
      args = func.call(null, args);
      if (args && args.length) {
        return args;
      }
      throw TypeError("Must return an array-like object!");
    };
    isDev && (replaceArgs = bind.toString(func, replaceArgs));
    this._argPhases.push(replaceArgs);
  },
  defineOptions: function(options) {
    var optionDefaults, optionNames, optionTypes, requiredTypes, validateOptions;
    assertType(options, Object);
    if (this._optionTypes) {
      throw Error("'defineOptions' must only be called once!");
    }
    optionNames = [];
    optionTypes = {};
    optionDefaults = {};
    requiredTypes = {};
    sync.each(options, function(option, name) {
      var optionType;
      optionNames.push(name);
      if (!isType(option, Object)) {
        optionTypes[name] = option;
        return;
      }
      if (has(option, "default")) {
        optionDefaults[name] = option["default"];
      }
      if (optionType = option.type) {
        if (isType(optionType, Object)) {
          optionType = Shape(optionType);
        }
        if (option.required) {
          requiredTypes[name] = true;
        }
        return optionTypes[name] = optionType;
      }
    });
    validateOptions = function(args) {
      var i, len, name, option, optionType;
      options = args[0];
      options || (args[0] = options = {});
      assertType(options, Object, "options");
      for (i = 0, len = optionNames.length; i < len; i++) {
        name = optionNames[i];
        option = options[name];
        if (option === void 0) {
          if (optionDefaults[name] !== void 0) {
            options[name] = option = optionDefaults[name];
          } else if (!requiredTypes[name]) {
            continue;
          }
        }
        if (isDev) {
          optionType = optionTypes[name];
          optionType && assertType(option, optionType, "options." + name);
        }
      }
      return args;
    };
    this._optionTypes = optionTypes;
    this._argPhases.push(validateOptions);
    this.didBuild(function(type) {
      if (hasKeys(optionTypes)) {
        type.optionTypes = optionTypes;
        overrideObjectToString(optionTypes, gatherTypeNames);
      }
      if (hasKeys(optionDefaults)) {
        return type.optionDefaults = optionDefaults;
      }
    });
  },
  returnCached: function(func) {
    assertType(func, Function);
    this._getCacheID = func;
    this.didBuild(function(type) {
      type.cache = Object.create(null);
    });
  },
  returnExisting: function(func) {
    assertType(func, Function);
    this._getExisting = func;
  }
});

define(TypeBuilder.prototype, {
  __buildArgCreator: function() {
    var phases;
    phases = this._argPhases;
    if (phases.length === 0) {
      return emptyFunction.thatReturnsArgument;
    }
    return function(args) {
      var i, len, phase;
      args = sliceArray(args);
      for (i = 0, len = phases.length; i < len; i++) {
        phase = phases[i];
        args = phase.call(null, args);
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
