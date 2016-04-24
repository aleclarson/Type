var AnimatedValue, Animation, Event, Factory, Immutable, Kind, Maybe, NativeValue, Progress, Reaction, Tracer, assert, assertType, combine, configTypes, emptyFunction, hook, isDev, isType, ref, roundToScreenScale, steal, sync, validateTypes,
  slice = [].slice;

ref = require("type-utils"), isType = ref.isType, validateTypes = ref.validateTypes, assertType = ref.assertType, assert = ref.assert, Maybe = ref.Maybe, Kind = ref.Kind;

AnimatedValue = require("Animated").AnimatedValue;

roundToScreenScale = require("device").roundToScreenScale;

emptyFunction = require("emptyFunction");

Immutable = require("immutable");

Progress = require("progress");

Reaction = require("reaction");

Factory = require("factory");

combine = require("combine");

Tracer = require("tracer");

Event = require("event");

steal = require("steal");

isDev = require("isDev");

sync = require("sync");

hook = require("hook");

Animation = require("./Animation");

if (isDev) {
  configTypes = {};
  configTypes.animate = {
    type: Function.Kind,
    onUpdate: Maybe(Function.Kind),
    onEnd: Maybe(Function.Kind),
    onFinish: Maybe(Function.Kind)
  };
}

module.exports = NativeValue = Factory("NativeValue", {
  initArguments: function(value, keyPath) {
    assertType(keyPath, String.Maybe, "keyPath");
    return arguments;
  },
  getFromCache: function(value) {
    if (isKind(value, NativeValue)) {
      return value;
    } else {
      return void 0;
    }
  },
  customValues: {
    keyPath: {
      get: function() {
        return this._keyPath;
      },
      set: function(keyPath) {
        var ref1;
        this._keyPath = keyPath;
        return (ref1 = this._reaction) != null ? ref1.keyPath = keyPath : void 0;
      }
    },
    value: {
      get: function() {
        return this._value;
      },
      set: function(newValue) {
        assert(!this.isReactive, {
          reason: "Cannot set 'value' when 'isReactive' is true!",
          nativeValue: this
        });
        if (this.isAnimated) {
          this._animated.setValue(newValue);
          return;
        }
        return this._setValue(newValue);
      }
    },
    getValue: {
      lazy: function() {
        return (function(_this) {
          return function() {
            return _this._value;
          };
        })(this);
      }
    },
    fromValue: {
      get: function() {
        return this._fromValue;
      }
    },
    toValue: {
      get: function() {
        return this._toValue;
      }
    },
    distance: {
      get: function() {
        return this._toValue - this._fromValue;
      }
    },
    progress: {
      get: function() {
        return this.getProgress();
      },
      set: function(progress) {
        return this.setProgress({
          progress: progress,
          clamp: true,
          round: true
        });
      }
    },
    animation: {
      get: function() {
        return this._animation;
      }
    },
    isAnimated: {
      get: function() {
        return this._animated !== null;
      }
    },
    isAnimating: {
      get: function() {
        return this._animation !== null;
      }
    },
    isReactive: {
      get: function() {
        return this._reaction != null;
      }
    },
    reaction: {
      get: function() {
        return this._reaction;
      },
      set: function(newValue, oldValue) {
        if (newValue === oldValue) {
          return;
        }
        return this._attachReaction(newValue);
      }
    }
  },
  initFrozenValues: function() {
    return {
      didSet: Event(),
      didAnimationEnd: Event({
        maxRecursion: 10
      })
    };
  },
  initValues: function(value, keyPath) {
    return {
      _keyPath: keyPath,
      _inputRange: null,
      _easing: null,
      _reaction: null,
      _reactionListener: null,
      _animated: null,
      _animation: null,
      _animatedListener: null,
      _tracer: emptyFunction
    };
  },
  initReactiveValues: function() {
    return {
      _value: null,
      _fromValue: null,
      _toValue: null
    };
  },
  init: function(value, keyPath) {
    if (isType(value, Reaction)) {
      if (value.keyPath == null) {
        value.keyPath = keyPath;
      }
      return this.reaction = value;
    } else if (isType(value, Function.Kind)) {
      return this.reaction = Reaction.sync({
        keyPath: keyPath,
        get: value
      });
    } else if (isType(value, Object)) {
      if (value.keyPath == null) {
        value.keyPath = keyPath;
      }
      return this.reaction = Reaction.sync(value);
    } else {
      return this.value = value;
    }
  },
  detach: function() {},
  absorb: function() {
    var nativeValues, newValue;
    nativeValues = 1 <= arguments.length ? slice.call(arguments, 0) : [];
    newValue = this.value;
    sync.each(nativeValues, function(nativeValue) {
      newValue += nativeValue.value;
      return nativeValue.value = 0;
    });
    return this.value = newValue;
  },
  animate: function(config) {
    var animation, hasEnded, onEnd, onFinish, onUpdate;
    assert(!this.isReactive, {
      reason: "Cannot call 'animate' when 'isReactive' is true!",
      nativeValue: this
    });
    if (isDev) {
      this._tracer = Tracer("When the Animation was created");
    }
    if (this._animation) {
      this._animation.stop();
    }
    this._attachAnimated();
    if (isDev) {
      validateTypes(config, configTypes.animate);
    }
    onUpdate = steal(config, "onUpdate", emptyFunction);
    onFinish = steal(config, "onFinish", emptyFunction);
    onEnd = steal(config, "onEnd", emptyFunction);
    hasEnded = false;
    animation = Animation({
      animated: this._animated,
      type: steal(config, "type"),
      config: config,
      onUpdate: (function(_this) {
        return function(value) {
          assert(!hasEnded, "Must be animating!");
          assert(_this.isAnimating, "Must be animating!");
          return onUpdate(value);
        };
      })(this),
      onEnd: (function(_this) {
        return function(finished) {
          assert(!hasEnded, "Must be animating!");
          hasEnded = true;
          _this._animation = null;
          if (finished) {
            onFinish();
          }
          onEnd(finished);
          return _this.didAnimationEnd.emit(finished);
        };
      })(this)
    });
    this._fromValue = animation.fromValue;
    this._toValue = animation.toValue;
    return this._animation = animation;
  },
  getProgress: function(options) {
    var optionDefaults, value;
    assert(!this.isReactive, {
      reason: "Cannot call 'getProgress' when 'isReactive' is true!",
      nativeValue: this
    });
    optionDefaults = {
      at: this._value,
      to: this._toValue,
      from: this._fromValue != null ? this._fromValue : this._value
    };
    options = combine(optionDefaults, options);
    validateTypes(options, {
      at: Number,
      to: Number,
      from: Number,
      clamp: Boolean.Maybe
    });
    value = steal(options, "at");
    return Progress.fromValue(value, options);
  },
  setProgress: function(options) {
    var optionDefaults, progress, value;
    assert(!this.isReactive, {
      reason: "Cannot call 'setProgress' when 'isReactive' is true!",
      nativeValue: this
    });
    if (isType(options, Number)) {
      options = {
        progress: options
      };
    }
    optionDefaults = {
      from: this._fromValue,
      to: this._toValue
    };
    options = combine(optionDefaults, options);
    validateTypes(options, {
      progress: Number,
      from: Number,
      to: Number,
      clamp: Boolean.Maybe,
      round: Boolean.Maybe
    });
    progress = steal(options, "progress");
    if (this._inputRange != null) {
      progress = this._applyInputRange(progress);
    }
    if (this._easing != null) {
      progress = this._easing(progress);
    }
    value = Progress.toValue(progress, options);
    if (options.round === true) {
      value = roundToScreenScale(value);
    }
    return this.value = value;
  },
  willProgress: function(config) {
    var easing, from, to, within;
    assert(!this.isReactive, {
      reason: "Cannot call 'willProgress' when 'isReactive' is true!",
      nativeValue: this
    });
    validateTypes(config, {
      from: Number.Maybe,
      to: Number,
      within: Array.Maybe,
      easing: Function.Maybe
    });
    to = config.to, from = config.from, within = config.within, easing = config.easing;
    if (within != null) {
      assert(within.length === 2);
      assert(within[0] <= within[1]);
    }
    this._inputRange = within;
    this._easing = easing;
    this._fromValue = from != null ? from : from = this._value;
    return this._toValue = to;
  },
  _setValue: function(newValue) {
    if (this.type !== void 0) {
      assertType(newValue, this.type, {
        nativeValue: this,
        stack: this._tracer()
      });
    }
    if (this._value === newValue) {
      return;
    }
    this._value = newValue;
    return this.didSet.emit(newValue);
  },
  _applyInputRange: function(value) {
    var max, min, ref1;
    assert(this._inputRange, Array);
    ref1 = this._inputRange, min = ref1[0], max = ref1[1];
    value = Math.max(min, Math.min(max, value));
    return (value - min) / (max - min);
  },
  _attachReaction: function(reaction) {
    var base;
    if (!reaction) {
      return this._detachReaction();
    }
    if (isType(reaction, [Object, Function.Kind])) {
      reaction = Reaction.sync(reaction);
    }
    assertType(reaction, Reaction);
    if (this.isReactive) {
      this._detachReaction();
    } else {
      this._detachAnimated();
    }
    this._tracer = reaction._traceInit;
    this._reaction = reaction;
    if ((base = this._reaction).keyPath == null) {
      base.keyPath = this.keyPath;
    }
    this._reactionListener = this._reaction.didSet((function(_this) {
      return function(newValue) {
        return _this._setValue(newValue);
      };
    })(this));
    return this._setValue(reaction.value);
  },
  _attachAnimated: function() {
    if (this._animated) {
      return;
    }
    this._animated = new AnimatedValue(this._value);
    return this._animatedListener = this._animated.didSet((function(_this) {
      return function(value) {
        return _this._setValue(value);
      };
    })(this));
  },
  _detachReaction: function() {
    if (!this.isReactive) {
      return;
    }
    this._reactionListener.stop();
    this._reactionListener = null;
    this._reaction = null;
  },
  _detachAnimated: function() {
    if (!this.isAnimated) {
      return;
    }
    this._animated.stopAnimation();
    this._animatedListener.stop();
    this._animatedListener = null;
    this._animated = null;
  }
});

//# sourceMappingURL=../../../map/src/component/NativeValue.map
