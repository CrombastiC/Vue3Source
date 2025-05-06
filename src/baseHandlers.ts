import {track,trigger} from './effect'
import {hasChanged, isObject} from './utils'
import {ReactiveFlags,reactive} from './reactive'
import { TrackOpTypes,TriggerOpTypes } from './operation'
//用来表示对对象的"迭代依赖的标识"
export const ITERATE_KEY = Symbol('')
function get(target:object,key:string|symbol,receiver:object):any{
  if(key === ReactiveFlags.IS_REACTIVE){
    return true
  }
  //todo:依赖收集
  track(target,TrackOpTypes.GET,key)
  //返回对象的相应属性值
  const result = Reflect.get(target,key,receiver)

  //如果是对象，再次进行递归处理，用于处理嵌套对象
  if(isObject(result)){
    return reactive(result)
  }
  return result
}

function set(target:Record<string|symbol,unknown>,key:string|symbol,value:unknown,receiver:object):boolean{
  //判断对象是否有这个属性
  const hasKey = target.hasOwnProperty(key)
  let oldValue = target[key]
  if(!hasKey){
    //如果没有这个属性，说明是新增的属性

    trigger(target,TriggerOpTypes.ADD,key)
  }else if(hasChanged(value,oldValue)){
    //如果有这个属性，说明是修改的属性
    //如果值发生了变化，说明是修改的属性
    trigger(target,TriggerOpTypes.SET,key)
  }

  //设置对象的相应属性值
  const result = Reflect.set(target,key,value,receiver)
  //返回设置结果
  return result
}

//in 关键字在js中触发的是HasProperty正好对应Proxy中的has方法
//判断对象是否有相应属性
function has(target:object,key:string|symbol):boolean{  
  //todo:依赖收集
  track(target,TrackOpTypes.HAS,key)
  //判断对象是否有相应属性
  const result = Reflect.has(target,key)
  //返回判断结果
  return result
}
//获取对象的所有属性
//在js中for...in 关键字触发的是IterateProperty正好对应Proxy中的ownKeys方法
function ownKeys(target:object):(string|symbol)[] {
  track(target,TrackOpTypes.ITERATE,ITERATE_KEY)
  //获取对象的所有属性
  return Reflect.ownKeys(target)
}
//删除对象的属性
function deleteProperty(target:Record<string|symbol,unknown>,key:string|symbol){
  //判断对象是否有这个属性
  const hasKey = target.hasOwnProperty(key)
  //删除是否成功
  const result = Reflect.deleteProperty(target,key)
  //对象有这个属性，并且删除成功
  if(hasKey && result){

    trigger(target, TriggerOpTypes.DELETE, key)
  }
  //返回删除结果
  return result

}
export const mutableHandlers:ProxyHandler<object> = {
  get,
  set,
  has,
  ownKeys,
  deleteProperty
}
