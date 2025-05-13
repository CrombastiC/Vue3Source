import { reactive, toRaw } from "./reactive"
import { hasChanged, isArray, isObject } from "./utils";
import { track, trigger } from "./effect";
import { TrackOpTypes, TriggerOpTypes } from "./operations";

export interface Ref<T = any> { 
  value: T;
}

export function isRef<T>(r: Ref<T> | unknown): r is Ref<T>
export function isRef(r: any): r is Ref { 
  return Boolean(r && r.__v_isRef === true);
}

export function ref(value?: any): any { 
  return createRef(value);
}
export function shallowRef(value?: any): any { 
  return createRef(value, true);
}

function createRef(rawValue: unknown, shallow = false) { 
  // 如果rawValue是ref对象，直接返回
  if (isRef(rawValue)) { 
    return rawValue;
  }

  // 其他情况，我们通过RefImpl类来实现
  return new RefImpl(rawValue, shallow);
}
//判断是否是对象 是对象就返回一个响应式对象 不是就返回原值
const convert = <T extends unknown>(val: T): T => { 
  return isObject(val) ? reactive(val) : val;
}

class RefImpl<T> { 
  private _value: T;
  public readonly __v_isRef = true;
  //如果是浅响应式就在ref进行处理，不是，就交给reactive处理
  constructor(private _rawValue: T, private readonly _shallow: boolean) { 
    this._value = _shallow ? _rawValue : convert(_rawValue)
  }

  get value() { 
    track(toRaw(this), TrackOpTypes.GET, 'value');
    return this._value;
  }

  set value(newVal) { 
    if (hasChanged(toRaw(newVal), this._rawValue)) { 
      this._rawValue = newVal;
      this._value = this._shallow ? newVal : convert(newVal);
      trigger(toRaw(this), TriggerOpTypes.SET, 'value', newVal);
    }
  }
}

export function toRef<T extends object, K extends keyof T>(
  object: T,//传入的对象
  key: K//传入的key
) : Ref<T[K]> { 
  //如果传入的对象是ref对象，直接返回
  return isRef(object[key])
    ? (object[key] as Ref<T[K]>)
    : new ObjectRefImpl(object, key) as any;
}

class ObjectRefImpl<T extends object, K extends keyof T> { 
  public readonly __v_isRef = true;
  constructor(private _object: T, private _key: K) { }

  get value() { 
    return this._object[this._key];
  }

  set value(newVal) { 
    this._object[this._key] = newVal;
  }
}

export type ToRefs<T = any> = { [K in keyof T]: Ref<T[K]> }
//批量转换对象的属性为ref对象
export function toRefs<T extends object>(object: T): ToRefs<T> { 
  const ret:any = isArray(object) ? new Array(object.length) : {};
  for (const key in object) { 
    ret[key] = toRef(object, key);
  }
  return ret;
}

export type shallowUnwrapRef<T> = {
  [K in keyof T]: T[K] extends Ref<infer V> ? V : T[K]
}

export function unref<T>(ref: Ref<T>): T;
export function unref<T>(ref: T): T;
export function unref(ref: any) {
  return isRef(ref) ? ref.value : ref;
}
//shallowUnwrapHandlers这个的作用是将ref对象的值进行解包
export const shallowUnwrapHandlers: ProxyHandler<any> = {
  get:(target, key, reactive) => unref(Reflect.get(target, key, reactive)),
  set: (target, key, value, reactive) => { 
    const oldValue = target[key];
    if (isRef(oldValue) && !isRef(value)) {
      oldValue.value = value;
      return true;
    }
    else { 
      return Reflect.set(target, key, value, reactive);
    }
  }
}

export function proxyRefs<T extends object>(
  objectWithRefs: T
): shallowUnwrapRef<T> { 
  return new Proxy(objectWithRefs, shallowUnwrapHandlers)
}
