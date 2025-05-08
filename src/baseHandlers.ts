import { enableTracking, pauseTracking, track, trigger } from './effect'
import { hasChanged, isArray, isObject } from './utils'
import { ReactiveFlags, reactive, toRaw, targetMap, readonlyMap, reactiveMap, readonly } from './reactive'
import { TrackOpTypes, TriggerOpTypes } from './operation'
//用来表示对对象的"迭代依赖的标识"
export const ITERATE_KEY = Symbol('')

//改动之后的数组方法，通过arrayInstrumentations统一管理
const arrayInstrumentations: Record<string, Function> = {};

//需要是元组类型，这样Array.prototype就可以通过key来访问到对应的方法
; (['includes', 'indexOf', 'lastIndexOf'] as const).forEach(key => {
  //先获取原生方法的引用
  const method = Array.prototype[key] as any
  arrayInstrumentations[key] = function (this: unknown[], ...args: unknown[]) {
    //将this转化为非响应式(代理)对象
    const arr = toRaw(this)
    //遍历当前数组的每个索引，通过track函数对数组索引进行依赖收集
    for (let i = 0, l = this.length; i < l; i++) {
      track(arr, TrackOpTypes.GET, i + '')
    }
    //直接在原始对象中查找，使用原始数组和参数
    const res = method.apply(arr, args)
    if (res === -1 || res === false) {
      //如果没有找到，注意，还需要进行处理，因为参数也有可能是响应式的
      return method.apply(arr, args.map(toRaw))
    } else {
      return res
    }
  }
})

  ; (['push', 'pop', 'shift', 'unshift', 'splice'] as const).forEach(key => {
    const method = Array.prototype[key] as any
    arrayInstrumentations[key] = function (this: unknown[], ...args: unknown[]) {
      pauseTracking()
      const res = method.apply(this, args)
      enableTracking()
      return res
    }
  })
function createGetter(isReadonly = false, shallow = false) {
  return function get(target: object, key: string | symbol, receiver: object): any {
    //如果访问的是IS_REACTIVE属性， 返回true
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true
    }
    //如果访问的是IS_READONLY属性， 返回true
    if (key === ReactiveFlags.IS_READONLY) {
      return isReadonly
    } else if (key === ReactiveFlags.RAW && // 当代理对象访问__v_raw属性时，返回原始对象
      receiver === (isReadonly ? readonlyMap : reactiveMap).get(target) // 确保请求原始对象的访问是代理对象发起的
    ) {
      //如果访问的是RAW属性，返回原始对象
      return target
    }

    //如果是数组，使用arrayInstrumentations中的方法
    const targetIsArray = isArray(target)
    if (targetIsArray && arrayInstrumentations.hasOwnProperty(key)) {
      return Reflect.get(arrayInstrumentations, key, receiver);
    }
    //todo: 依赖收集
    //只有在非只读的情况下才会收集依赖
    if (!isReadonly) {
      //依赖收集
      track(target, TrackOpTypes.GET, key)
    }

    //返回对象的相应属性值
    const result = Reflect.get(target, key, receiver);

    //如果是对象，再次进行递归代理
    if (isObject(result)) {
      return isReadonly ? readonly(result) : reactive(result);
    }

    return result;
  }
}
const get = createGetter()
const readonlyGet = createGetter(true);
// function get(target: object, key: string | symbol, receiver: object): any { 
//   if (key === ReactiveFlags.IS_REACTIVE) {
//     return true;
//   }
//   else if (
//     key === ReactiveFlags.RAW // 当代理对象访问__v_raw属性时，返回原始对象
//     && receiver === targetMap.get(target) // 确保请求原始对象的访问是代理对象发起的
//   ) { 
//     return target;
//   }


//   const targetIsArray = isArray(target);
//   if (targetIsArray && arrayInstrumentations.hasOwnProperty(key)) { 
//     return Reflect.get(arrayInstrumentations, key, receiver);
//   }


//   // todo: 收集依赖
//   track(target, TrackOpTypes.GET, key);
//   // 返回对象的相应属性值
//   const result = Reflect.get(target, key, receiver);

//   // 如果是对象，再次进行递归代理
//   if (isObject(result)) { 
//     return reactive(result);
//   }

//   return result;
// }
function set(target: Record<string | symbol, unknown>, key: string | symbol, value: unknown, receiver: object): boolean {
  //判断对象是否有这个属性
  // const hasKey = target.hasOwnProperty(key)
  const type = target.hasOwnProperty(key) ? TriggerOpTypes.SET : TriggerOpTypes.ADD
  let oldValue = target[key]
  const oldLen = Array.isArray(target) ? target.length : 0
  // if (!hasKey) {
  //   //如果没有这个属性，说明是新增的属性

  //   trigger(target, TriggerOpTypes.ADD, key)
  // } else if (hasChanged(value, oldValue)) {
  //   //如果有这个属性，说明是修改的属性
  //   //如果值发生了变化，说明是修改的属性
  //   trigger(target, TriggerOpTypes.SET, key)
  // }

  //设置对象的相应属性值
  const result = Reflect.set(target, key, value, receiver)

  if (!result) {
    return result
  }

  const newLen = Array.isArray(target) ? target.length : 0

  if (hasChanged(value, oldValue) || type === TriggerOpTypes.ADD) {
    trigger(target, type, key)
    if (Array.isArray(target) && oldLen !== newLen) {
      //如果是数组，并且长度发生了变化，说明是新增的属性
      if (key !== 'length') {
        trigger(target, TriggerOpTypes.ADD, 'length')
      } else {
        //当操作的key是length时，说明是删除了数组的元素。所以新的长度小于旧的长度
        for (let i = newLen; i < oldLen; i++) {
          //遍历旧的数组，触发删除操作
          trigger(target, TriggerOpTypes.DELETE, i)
        }
      }
    }
  }
  //返回设置结果
  return result
}

//in 关键字在js中触发的是HasProperty正好对应Proxy中的has方法
//判断对象是否有相应属性
function has(target: object, key: string | symbol): boolean {
  //todo:依赖收集
  track(target, TrackOpTypes.HAS, key)
  //判断对象是否有相应属性
  const result = Reflect.has(target, key)
  //返回判断结果
  return result
}
//获取对象的所有属性
//在js中for...in 关键字触发的是IterateProperty正好对应Proxy中的ownKeys方法
function ownKeys(target: object): (string | symbol)[] {
  track(target, TrackOpTypes.ITERATE, ITERATE_KEY)
  //获取对象的所有属性
  return Reflect.ownKeys(target)
}
//删除对象的属性
function deleteProperty(target: Record<string | symbol, unknown>, key: string | symbol) {
  //判断对象是否有这个属性
  const hasKey = target.hasOwnProperty(key)
  //删除是否成功
  const result = Reflect.deleteProperty(target, key)
  //对象有这个属性，并且删除成功才会触发更新
  if (hasKey && result) {

    trigger(target, TriggerOpTypes.DELETE, key)
  }
  //返回删除结果
  return result

}
export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  has,
  ownKeys,
  deleteProperty
}

export const readonlyHandlers: ProxyHandler<object> = {
  get: readonlyGet,
  set(target, key) {
    console.warn(`属性${String(key)}是只读的，不能修改`, target)
    return true
  },
  deleteProperty(target, key) {
    console.warn(`属性${String(key)}是只读的，不能删除`, target)
    return true
  }
 
}
