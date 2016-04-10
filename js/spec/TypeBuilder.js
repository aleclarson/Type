var TypeBuilder;

TypeBuilder = require("../src/TypeBuilder");

TypeBuilder.allowDuplicateNames();

describe("TypeBuilder.prototype", function() {
  describe("finalize()", function() {
    it("creates the constructor", function() {
      var Foo, type;
      type = TypeBuilder("Foo");
      Foo = type.finalize();
      expect(Foo.name).toBe("Foo");
      return expect(getType(Foo)).toBe(Function);
    });
    return it("should only be called once", function() {
      var type;
      type = TypeBuilder("Foo");
      type.finalize();
      return expect(function() {
        return type.finalize();
      }).toThrowError("This type is already finalized!");
    });
  });
  return describe("inherits()", function() {
    it("determines what the prototype inherits from", function() {
      var Foo, type;
      type = TypeBuilder("Foo");
      type.inherits(Function);
      Foo = type.finalize();
      return expect(getKind(Foo)).toBe(Function);
    });
    it("can equal null", function() {
      var Foo, type;
      type = TypeBuilder("Foo");
      type.inherits(null);
      Foo = type.finalize();
      return expect(getKind(Foo)).toBe(null);
    });
    return it("defaults to Object if not called", function() {
      var type;
      type = TypeBuilder("Foo");
      return expect(type.config.kind).toBe(Object);
    });
  });
});

//# sourceMappingURL=../../map/spec/TypeBuilder.map
