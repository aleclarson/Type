
type = Component "ChannelBar"

type.contextType = require "."

type.propTypes = {}

type.render ->

  foo = View
    style: @styles.foo()

type.styles =

  foo: ->
    position: "absolute"
    backgroundColor: @bkgColor

  bar:
    position: "absolute"

module.exports =
Component = NamedFunction "Component", ->

Component.Builder = require "./ComponentBuilder"
