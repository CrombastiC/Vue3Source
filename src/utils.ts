// 自定义守卫是指通过 `{形参} is {类型}` 的语法结构，
// 来给返回布尔值的条件函数赋予类型守卫的能力
// 类型收窄只能在同一的函数中，如果在不同的函数中就不起作用。
// 如果判断val is object，下面的val.then会报错，object上没有then方法
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

//值有变化
export const hasChanged = (value: any, oldValue: any): boolean => {
  return !Object.is(value, oldValue)
}
