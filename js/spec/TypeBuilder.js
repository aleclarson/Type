var TypeBuilder;

TypeBuilder = require("../src/TypeBuilder");

require("../src/TypeRegistry").isEnabled = false;

describe("TypeBuilder.prototype", function() {
  describe("build()", function() {
    it("creates the constructor", function() {
      var Foo, type;
      type = TypeBuilder("Foo");
      Foo = type.build();
      expect(Foo.name).toBe("Foo");
      return expect(getType(Foo)).toBe(Function);
    });
    return it("only builds once", function() {
      var Foo1, Foo2, type;
      type = TypeBuilder("Foo");
      Foo1 = type.build();
      Foo2 = type.build();
      return expect(Foo1).toBe(Foo2);
    });
  });
  describe("construct()", function() {
    return it("calls the constructor immediately", function() {
      var foo, type;
      type = TypeBuilder("Foo");
      foo = type.construct();
      return expect(getType(foo).name).toBe("Foo");
    });
  });
  describe("inherits()", function() {
    it("determines what the prototype inherits from", function() {
      var Foo, type;
      type = TypeBuilder("Foo");
      type.inherits(Function);
      Foo = type.build();
      return expect(getKind(Foo)).toBe(Function);
    });
    it("can equal null", function() {
      var Foo, type;
      type = TypeBuilder("Foo");
      type.inherits(null);
      Foo = type.build();
      return expect(getKind(Foo)).toBe(null);
    });
    return it("defaults to Object if not called", function() {
      var type;
      type = TypeBuilder("Foo");
      return expect(type._kind).toBe(Object);
    });
  });
  describe("createArguments()", function() {
    it("is passed an Array of arguments", function() {
      var type;
      type = TypeBuilder("Foo");
      type.createArguments(function(args) {
        expect(getType(args)).toBe(Array);
        expect(args[0]).toBe(1);
        expect(args[1]).toBe(2);
        return args;
      });
      return type.construct(1, 2);
    });
    it("should always return an Array", function() {
      var type;
      type = TypeBuilder("Foo");
      type.createArguments(function(args) {
        return null;
      });
      return expect(function() {
        return type.construct();
      }).toThrowError("Must return an Array of arguments!");
    });
    return it("can be called multiple times (useful for mixins)", function() {
      var type;
      type = TypeBuilder("Foo");
      type.createArguments(function() {
        return [1];
      });
      type.createArguments(function(args) {
        expect(args[0]).toBe(1);
        return args;
      });
      return type.construct(2);
    });
  });
  describe("argumentTypes { get, set }", function() {
    it("can only be defined once", function() {
      var type;
      type = TypeBuilder("Foo");
      type.argumentTypes = {};
      return expect(function() {
        return type.argumentTypes = {};
      }).toThrowError("'argumentTypes' is already defined!");
    });
    it("validates the type of each argument", function() {
      var type;
      type = TypeBuilder("Foo");
      type.argumentTypes = {
        first: Number,
        second: Boolean
      };
      expect(function() {
        return type.construct();
      }).toThrowError("'first' must be a Number!");
      expect(function() {
        return type.construct(1);
      }).toThrowError("'second' must be a Boolean!");
      return expect(function() {
        return type.construct(1, true);
      }).not.toThrow();
    });
    return it("works with an array of types", function() {
      var type;
      type = TypeBuilder("Foo");
      type.argumentTypes = [Number, Boolean];
      expect(function() {
        return type.construct();
      }).toThrowError("'args[0]' must be a Number!");
      expect(function() {
        return type.construct(1);
      }).toThrowError("'args[1]' must be a Boolean!");
      return expect(function() {
        return type.construct(1, true);
      }).not.toThrow();
    });
  });
  describe("optionTypes { get, set }", function() {
    it("can only be defined once", function() {
      var type;
      type = TypeBuilder("Foo");
      type.optionTypes = {};
      return expect(function() {
        return type.optionTypes = {};
      }).toThrowError("'optionTypes' is already defined!");
    });
    return it("validates the type of each option", function() {
      var type;
      type = TypeBuilder("Foo");
      type.optionTypes = {
        foo: Number,
        bar: Boolean
      };
      expect(function() {
        return type.construct();
      }).toThrowError("'foo' must be a Number!");
      expect(function() {
        return type.construct({
          foo: 1
        });
      }).toThrowError("'bar' must be a Boolean!");
      return expect(function() {
        return type.construct({
          foo: 1,
          bar: false
        });
      }).not.toThrow();
    });
  });
  describe("optionDefaults { get, set }", function() {
    it("can only be defined once", function() {
      var type;
      type = TypeBuilder("Foo");
      type.optionDefaults = {};
      return expect(function() {
        return type.optionDefaults = {};
      }).toThrowError("'optionDefaults' is already defined!");
    });
    it("creates an empty options object if needed", function() {
      var foo, type;
      type = TypeBuilder("Foo");
      type.optionDefaults = {
        foo: 1
      };
      type.init(function(options) {
        expect(options).not.toBe(void 0);
        return expect(options.foo).toBe(1);
      });
      return foo = type.construct();
    });
    return it("sets undefined options to their default values", function() {
      var foo, type;
      type = TypeBuilder("Foo");
      type.optionDefaults = {
        foo: 1,
        bar: true
      };
      type.init(function(options) {
        return this.options = options;
      });
      foo = type.construct({
        bar: false
      });
      expect(foo.options.foo).toBe(1);
      return expect(foo.options.bar).toBe(false);
    });
  });
  describe("overrideMethods()", function() {
    return it("allows the use of 'this.__super()'", function() {
      var Bar, Foo, bar, barSpy, fooSpy, type;
      fooSpy = jasmine.createSpy();
      type = TypeBuilder("Foo");
      type.defineMethods({
        test: function(a, b) {
          return fooSpy(a, b);
        }
      });
      Foo = type.build();
      barSpy = jasmine.createSpy();
      type = TypeBuilder("Bar");
      type.inherits(Foo);
      type.overrideMethods({
        test: function(a, b) {
          barSpy(a, b);
          return this.__super(arguments);
        }
      });
      Bar = type.build();
      bar = Bar();
      bar.test(1, 2);
      expect(barSpy.calls.argsFor(0)).toEqual([1, 2]);
      return expect(fooSpy.calls.argsFor(0)).toEqual([1, 2]);
    });
  });
  describe("returnCached()", function() {
    it("creates a cache for the type", function() {
      var Foo, type;
      type = TypeBuilder("Foo");
      type.returnCached(emptyFunction);
      Foo = type.build();
      return expect(getType(Foo.cache)).toBe(null);
    });
    it("uses the return value to cache instances", function() {
      var Foo, type;
      type = TypeBuilder("Foo");
      type.returnCached(function() {
        return "foo";
      });
      Foo = type.build();
      return expect(Foo()).toBe(Foo());
    });
    return it("is passed the constructor's arguments", function() {
      var Foo, type;
      type = TypeBuilder("Foo");
      type.returnCached(function(options) {
        return options.id;
      });
      Foo = type.build();
      expect(Foo({
        id: "foo"
      })).toBe(Foo({
        id: "foo"
      }));
      return expect(Foo({
        id: "foo"
      })).not.toBe(Foo({
        id: "bar"
      }));
    });
  });
  return describe("returnExisting()", function() {
    return it("avoids creating a new instance if the return value isnt undefined", function() {
      var Foo, foo, type;
      type = TypeBuilder("Foo");
      type.returnExisting(function(arg) {
        if (isType(arg, Foo)) {
          return arg;
        }
      });
      Foo = type.build();
      foo = Foo(1);
      expect(getType(foo)).toBe(Foo);
      return expect(Foo(foo)).toBe(foo);
    });
  });
});

//# sourceMappingURL=../../map/spec/TypeBuilder.map
