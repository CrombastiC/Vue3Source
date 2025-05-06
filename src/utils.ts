//自定义守卫 `形参 is 类型`的语法结构
//是否是一个对象
export const isObject = (val: unknown): val is Record<any, any> => {
  return val !== null && typeof val === 'object'
}
//是否是一个字符串
export const isString = (val: unknown): val is string => {
  return typeof val === 'string'
}
//是否是一个函数
export const isFunction = (val: unknown): val is Function => {
  return typeof val === 'function'
}
//是否是一个数组
export const isArray = Array.isArray
//是否是一个promise
export const isPromise = <T = any>(val: unknown): val is Promise<T> => {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch)
}
