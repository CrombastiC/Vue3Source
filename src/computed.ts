import { ReactiveEffect, effect,trigger,track } from './effect';
import { TrackOpTypes, TriggerOpTypes } from './operations';
import { ReactiveFlags, toRaw } from './reactive';
import { isFunction, NOOP } from './utils'

export type ComputedGetter<T> = (ctx?: any) => T;
export type ComputedSetter<T> = (v: T) => void;

export interface WriteableComputedOptions<T> { 
  get: ComputedGetter<T>;
  set: ComputedSetter<T>;
}

export interface Ref<T = any> { 
  value: T;
}

export interface WriteableComputedRef<T> extends Ref<T> { 
  readonly effect: ReactiveEffect<T>
}

export interface ComputedRef<T> extends WriteableComputedRef<T> { 
  readonly value: T;
}

export function computed<T>(getter: ComputedGetter<T>): ComputedRef<T>
export function computed<T>(options: WriteableComputedOptions<T>):WriteableComputedRef<T>
export function computed<T>(getterOrOptions: ComputedGetter<T> | WriteableComputedOptions<T>) { 
  let getter;
  let setter;

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = NOOP
  }
  else { 
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(
    getter,
    setter,
    isFunction(getterOrOptions) || !getterOrOptions.set
  )
}

class ComputedRefImpl<T> { 
  private _value!: T;
  private _dirty = true;
  public readonly effect: ReactiveEffect<T>;
  public readonly [ReactiveFlags.IS_READONLY]!: boolean

  constructor(
    getter:ComputedGetter<T>,
    private readonly _setter: ComputedSetter<T>,
    isReadonly: boolean
  ) { 
    this._setter = _setter;
    this.effect = effect(getter, {
      lazy: true,
      scheduler: () => { 
        if (!this._dirty) { 
          this._dirty = true;
          trigger(toRaw(this), TriggerOpTypes.SET, "value");
        }
      }
    })

    this[ReactiveFlags.IS_READONLY] = isReadonly;
  }

  get value() { 
    if (this._dirty) { 
      this._value = this.effect();
      this._dirty = false;
    }

    track(toRaw(this), TrackOpTypes.GET,"value");
    return this._value;
  }

  set value(newValue) { 
    this._setter(newValue);
  }
}
