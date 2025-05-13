import { mutableHandlers, readonlyHandlers, shallowReactiveHandlers } from './baseHandlers'
import { isObject } from './utils'
//定义枚举
export const enum ReactiveFlags {
  IS_REACTIVE = '__v_isReactive',
  IS_READONLY = '__v_isReadonly',
  RAW = '__v_raw',
  SKIP = '__v_skip'
}

export interface Target {
  [ReactiveFlags.IS_REACTIVE]?: boolean
  [ReactiveFlags.IS_READONLY]?: boolean
  [ReactiveFlags.RAW]?: any
  [ReactiveFlags.SKIP]?: boolean
}
//为了区分普通代理和只读代理分开存储
export const reactiveMap = new WeakMap<Target, any>()
export const readonlyMap = new WeakMap<Target, any>()

function createReactiveObject(
  target: Target,
  isReadonly: boolean,
  baseHandlers: ProxyHandler<any>,
) {
  //如果不是对象，就直接返回
  if (!isObject(target)) {
    console.error('Target is not an object');
    return target
  }
  //如果是已经代理过的对象，就不需要再次代理
  const proxyMap = isReadonly ? readonlyMap : reactiveMap
  const existingProxy = proxyMap.get(target)
  if (existingProxy) {
    return existingProxy
  }
  //只有读到了target[ReactiveFlags.IS_REACTIVE]，才会返回target
  if (target[ReactiveFlags.RAW] && target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }
  const proxy = new Proxy(target, baseHandlers)

  proxyMap.set(target, proxy)

  return proxy
}

//定义依赖树
export const targetMap = new WeakMap<Target, any>()

export function reactive<T extends object>(target: T): T;
export function reactive(target: object) {

  if (target && (target as Target)[ReactiveFlags.IS_READONLY]) {

    return target
  }

  return createReactiveObject(target, false, mutableHandlers)
}

//浅层代理
export function shallowReactive<T extends object>(target: T): T {
  return createReactiveObject(target, false, shallowReactiveHandlers)
}
/**
 *  类型体操比较实用的一个小技巧，通过下面的代码可以看到深层计算之后的结果
 *  T extends any ?
 *  {
 *  具体类型体操的代码
 *  }
 *  :never
 */
type DeepReadonly<T extends Record<string, any>> = T extends any ? {
  readonly [K in keyof T]: T[K] extends Record<string, any> ? DeepReadonly<T[K]> : T[K]
} : never
export function readonly<T extends object>(target: T): DeepReadonly<T> {
  return createReactiveObject(
    target,
    true,
    readonlyHandlers//readonlyHandlers处理3程序需要单独处理
  )
}

//浅层只读
export function toRaw<T>(observed: T): T {
  return (observed as Target)[ReactiveFlags.RAW] || observed

}

export function isReadonly(value: unknown): boolean { 
  return !!(value && (value as Target)[ReactiveFlags.IS_READONLY]);
}

export function isReactive(value: unknown): boolean { 
  if(isReadonly(value)) { 
    return isReactive((value as Target)[ReactiveFlags.RAW]);
  }
  return !!(value && (value as Target)[ReactiveFlags.IS_REACTIVE]);
}
