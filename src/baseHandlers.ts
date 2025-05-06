import {track,trigger} from './effect'
import {isObject} from './utils'
import {ReactiveFlags,reactive} from './reactive'

function get(target:object,key:string|symbol,receiver:object):any{
  if(key === ReactiveFlags.IS_REACTIVE){
    return true
  }
  //todo:依赖收集
  track(target,key)
  //返回对象的相应属性值
  const result = Reflect.get(target,key,receiver)

  //如果是对象，再次进行递归处理
  if(isObject(result)){
    return reactive(result)
  }
  return result
}

function set(target:object,key:string|symbol,value:unknown,receiver:object):boolean{
  //todo:触发更新
  trigger(target,key)
  //设置对象的相应属性值
  const result = Reflect.set(target,key,value,receiver)
  //返回设置结果
  return result
}

function has(target:object,key:string|symbol):boolean{  
  //todo:依赖收集
  track(target,key)
  //判断对象是否有相应属性
  const result = Reflect.has(target,key)
  //返回判断结果
  return result
}

export const mutableHandlers:ProxyHandler<object> = {
  get,
  set,
  has
}
