var Type;

Type = require("../src/Type");

Type.Builder.allowDuplicateNames();

describe("Type", function() {
  it("adds a 'Kind' property to instances", function() {
    var Foo;
    Foo = Type("Foo");
    Foo = Foo.finalize();
    return expect(Foo.Maybe).not.toBe(void 0);
  });
  it("adds a 'Maybe' property to instances", function() {
    var Foo;
    Foo = Type("Foo");
    Foo = Foo.finalize();
    return expect(Foo.Maybe).not.toBe(void 0);
  });
  return it("supports a function body", function() {
    var Foo, foo, spy;
    Foo = Type("Foo", spy = jasmine.createSpy());
    foo = Foo.construct();
    foo(1, 2);
    expect(spy.calls.count()).toBe(1);
    return expect(spy.calls.argsFor(0)).toEqual([1, 2]);
  });
});

//# sourceMappingURL=../../map/spec/Type.map
