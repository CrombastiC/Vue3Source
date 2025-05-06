import {track, trigger} from './effect'

export function reactive<T extends object>(target:T):T;
export function reactive(target:object){
  const proxy=new Proxy(target,{
    get(target,key){
      //todo: 依赖收集
      track(target,key)
      //返回对象的相应属性值
      const result=Reflect.get(target,key)
      return result
    },
    set(target,key,value){
      //todo:触发更新
      trigger(target,key)
      //设置对象的相应属性值
      const result=Reflect.set(target,key,value)
      //返回设置结果
      return result
    }
  })
  return proxy
}
