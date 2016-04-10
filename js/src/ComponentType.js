var Type, createElementFactory, type;

Type = require("./Type");

type = Type("ComponentType", function() {
  var self;
  return self = builder.build();
});

type.defineStatics({
  Builder: require("./ComponentTypeBuilder")
});

type.definePrototype({
  getName: function() {},
  bind: function(context) {
    var render;
    render = this;
    return function(props) {
      return render(context, props);
    };
  },
  finalize: function() {
    return createElementFactory;
  }
});

createElementFactory = function(type) {
  return function(props) {
    var key, mixins, ref, stack;
    if (props == null) {
      props = {};
    }
    if (isType(props, Array)) {
      props = combine.apply(null, props);
    }
    if (props.mixins) {
      mixins = steal(props, "mixins");
      assertType(mixins, Array, "props.mixins");
      props = combine.apply(null, [{}].concat(mixins.concat(props)));
    }
    key = props.key ? "" + props.key : null;
    delete props.key;
    ref = props.ref ? props.ref : null;
    delete props.ref;
    if (isDev) {
      stack = ["::  When component was constructed  ::", Error()];
      props.__stack = function() {
        return stack;
      };
    }
    return {
      type: type,
      key: key,
      ref: ref,
      props: props,
      $$typeof: ReactElement.type,
      _owner: ReactCurrentOwner.current,
      _store: {
        validated: false
      }
    };
  };
};

//# sourceMappingURL=../../map/src/ComponentType.map
