
TypeBuilder = require "../src/TypeBuilder"

TypeBuilder.allowDuplicateNames()

describe "TypeBuilder.prototype", ->

  describe "finalize()", ->

    it "creates the constructor", ->

      type = TypeBuilder "Foo"

      Foo = type.finalize()

      expect Foo.name
        .toBe "Foo"

      expect getType Foo
        .toBe Function

    it "should only be called once", ->

      type = TypeBuilder "Foo"

      type.finalize()

      expect -> type.finalize()
        .toThrowError "This type is already finalized!"

  describe "inherits()", ->

    it "determines what the prototype inherits from", ->

      type = TypeBuilder "Foo"

      type.inherits Function

      Foo = type.finalize()

      expect getKind Foo
        .toBe Function

    it "can equal null", ->

      type = TypeBuilder "Foo"

      type.inherits null

      Foo = type.finalize()

      expect getKind Foo
        .toBe null

    it "defaults to Object if not called", ->

      type = TypeBuilder "Foo"

      expect type.config.kind
        .toBe Object
