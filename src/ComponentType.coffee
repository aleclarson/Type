
Type = require "./Type"

type = Type "ComponentType", ->

  self = builder.build()

type.defineStatics

  Builder: require "./ComponentTypeBuilder"

type.definePrototype

  getName: ->
    # TODO: Traverse owners to create an identity.

  bind: (context) ->
    render = this
    return (props) ->
      render context, props

  finalize: ->
    createElementFactory

createElementFactory = (type) -> (props = {}) ->

  if isType props, Array
    props = combine.apply null, props

  if props.mixins
    mixins = steal props, "mixins"
    assertType mixins, Array, "props.mixins"
    props = combine.apply null, [ {} ].concat mixins.concat props

  key = if props.key then "" + props.key else null
  delete props.key

  ref = if props.ref then props.ref else null
  delete props.ref

  if isDev
    stack = [ "::  When component was constructed  ::", Error() ]
    props.__stack = -> stack

  return {
    type
    key
    ref
    props
    $$typeof: ReactElement.type
    _owner: ReactCurrentOwner.current
    _store: { validated: no }
  }
