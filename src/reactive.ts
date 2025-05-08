import { mutableHandlers } from './baseHandlers'
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
//定义依赖树
export const targetMap = new WeakMap<Target, any>()

export function reactive<T extends object>(target: T): T;
export function reactive(target: object) {
  //如果不是对象，就直接返回
  if (!isObject(target)) {
    console.error('Target is not an object');
    return target
  }
  //如果是已经代理过的对象，就不需要再次代理
  if (targetMap.has(target)) {
    return targetMap.get(target)//返回代理对象
  }
  //如果读到了target[ReactiveFlags.IS_REACTIVE]，就返回target
  if (target[ReactiveFlags.RAW] && target[ReactiveFlags.IS_REACTIVE]) {
    return target
  }
  const proxy = new Proxy(target, mutableHandlers);
  //将代理对象存入WeakMap中
  targetMap.set(target, proxy)

  return proxy
}

export function toRaw<T>(observed: T): T {
  return (observed as Target)[ReactiveFlags.RAW] || observed
  
}
