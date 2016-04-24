
TypeBuilder = require "../src/TypeBuilder"

require("../src/TypeRegistry").isEnabled = no

describe "TypeBuilder.prototype", ->

  describe "build()", ->

    it "creates the constructor", ->

      type = TypeBuilder "Foo"

      Foo = type.build()

      expect Foo.name
        .toBe "Foo"

      expect getType Foo
        .toBe Function

    it "only builds once", ->

      type = TypeBuilder "Foo"

      Foo1 = type.build()

      Foo2 = type.build()

      expect Foo1
        .toBe Foo2

  describe "construct()", ->

    it "calls the constructor immediately", ->

      type = TypeBuilder "Foo"

      foo = type.construct()

      expect getType(foo).name
        .toBe "Foo"

  describe "inherits()", ->

    it "determines what the prototype inherits from", ->

      type = TypeBuilder "Foo"

      type.inherits Function

      Foo = type.build()

      expect getKind Foo
        .toBe Function

    it "can equal null", ->

      type = TypeBuilder "Foo"

      type.inherits null

      Foo = type.build()

      expect getKind Foo
        .toBe null

    it "defaults to Object if not called", ->

      type = TypeBuilder "Foo"

      expect type._kind
        .toBe Object

  describe "createArguments()", ->

    it "is passed an Array of arguments", ->

      type = TypeBuilder "Foo"

      type.createArguments (args) ->

        expect getType args
          .toBe Array

        expect args[0]
          .toBe 1

        expect args[1]
          .toBe 2

        return args

      type.construct 1, 2

    it "should always return an Array", ->

      type = TypeBuilder "Foo"

      type.createArguments (args) ->
        return null

      expect -> type.construct()
        .toThrowError "Must return an Array of arguments!"

    it "can be called multiple times (useful for mixins)", ->

      type = TypeBuilder "Foo"

      type.createArguments -> [ 1 ]

      type.createArguments (args) ->

        expect args[0]
          .toBe 1

        return args

      type.construct 2

  describe "argumentTypes { get, set }", ->

    it "can only be defined once", ->

      type = TypeBuilder "Foo"

      type.argumentTypes = {}

      expect -> type.argumentTypes = {}
        .toThrowError "'argumentTypes' is already defined!"

    it "validates the type of each argument", ->

      type = TypeBuilder "Foo"

      type.argumentTypes =
        first: Number
        second: Boolean

      expect -> type.construct()
        .toThrowError "'first' must be a Number!"

      expect -> type.construct 1
        .toThrowError "'second' must be a Boolean!"

      expect -> type.construct 1, yes
        .not.toThrow()

    it "works with an array of types", ->

      type = TypeBuilder "Foo"

      type.argumentTypes = [ Number, Boolean ]

      expect -> type.construct()
        .toThrowError "'args[0]' must be a Number!"

      expect -> type.construct 1
        .toThrowError "'args[1]' must be a Boolean!"

      expect -> type.construct 1, yes
        .not.toThrow()

  describe "optionTypes { get, set }", ->

    it "can only be defined once", ->

      type = TypeBuilder "Foo"

      type.optionTypes = {}

      expect -> type.optionTypes = {}
        .toThrowError "'optionTypes' is already defined!"

    it "validates the type of each option", ->

      type = TypeBuilder "Foo"

      type.optionTypes =
        foo: Number
        bar: Boolean

      expect -> type.construct()
        .toThrowError "'foo' must be a Number!"

      expect -> type.construct { foo: 1 }
        .toThrowError "'bar' must be a Boolean!"

      expect -> type.construct { foo: 1, bar: no }
        .not.toThrow()

  describe "optionDefaults { get, set }", ->

    it "can only be defined once", ->

      type = TypeBuilder "Foo"

      type.optionDefaults = {}

      expect -> type.optionDefaults = {}
        .toThrowError "'optionDefaults' is already defined!"

    it "creates an empty options object if needed", ->

      type = TypeBuilder "Foo"

      type.optionDefaults = { foo: 1 }

      type.init (options) ->

        expect options
          .not.toBe undefined

        expect options.foo
          .toBe 1

      foo = type.construct()

    it "sets undefined options to their default values", ->

      type = TypeBuilder "Foo"

      type.optionDefaults = { foo: 1, bar: yes }

      type.init (options) ->
        @options = options

      foo = type.construct { bar: no }

      expect foo.options.foo
        .toBe 1

      expect foo.options.bar
        .toBe no

  describe "overrideMethods()", ->

    it "allows the use of 'this.__super()'", ->

      fooSpy = jasmine.createSpy()

      type = TypeBuilder "Foo"

      type.defineMethods

        test: (a, b) ->
          fooSpy a, b

      Foo = type.build()

      barSpy = jasmine.createSpy()

      type = TypeBuilder "Bar"

      type.inherits Foo

      type.overrideMethods

        test: (a, b) ->
          barSpy a, b
          @__super arguments

      Bar = type.build()

      bar = Bar()

      bar.test 1, 2

      expect barSpy.calls.argsFor 0
        .toEqual [ 1, 2 ]

      expect fooSpy.calls.argsFor 0
        .toEqual [ 1, 2 ]

  describe "returnCached()", ->

    it "creates a cache for the type", ->

      type = TypeBuilder "Foo"

      type.returnCached emptyFunction

      Foo = type.build()

      expect getType Foo.cache
        .toBe null

    it "uses the return value to cache instances", ->

      type = TypeBuilder "Foo"

      type.returnCached -> "foo"

      Foo = type.build()

      expect Foo()
        .toBe Foo()

    it "is passed the constructor's arguments", ->

      type = TypeBuilder "Foo"

      type.returnCached (options) -> options.id

      Foo = type.build()

      expect Foo { id: "foo" }
        .toBe Foo { id: "foo" }

      expect Foo { id: "foo" }
        .not.toBe Foo { id: "bar" }

  describe "returnExisting()", ->

    it "avoids creating a new instance if the return value isnt undefined", ->

      type = TypeBuilder "Foo"

      type.returnExisting (arg) ->
        return arg if isType arg, Foo

      Foo = type.build()

      foo = Foo 1

      expect getType foo
        .toBe Foo

      expect Foo foo
        .toBe foo
