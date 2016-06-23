
Type = require "../src/Type"

require("../src/TypeRegistry").isEnabled = no

describe "Type", ->

  it "adds a 'Kind' property to instances", ->

    Foo = Type "Foo"

    Foo = Foo.build()

    expect Foo.Maybe
      .not.toBe undefined

  it "adds a 'Maybe' property to instances", ->

    Foo = Type "Foo"

    Foo = Foo.build()

    expect Foo.Maybe
      .not.toBe undefined

  it "supports a function body", ->

    Foo = Type "Foo", spy = jasmine.createSpy()

    foo = Foo.construct()

    foo 1, 2

    expect spy.calls.count()
      .toBe 1

    expect spy.calls.argsFor 0
      .toEqual [ 1, 2 ]
