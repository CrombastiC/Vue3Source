// import {reactive} from './reactive'

// const obj={
//   a:1,
//   b:2
// }

// const r = reactive(obj)
// console.log(r.a) // 1
// r.a = 3

//如果代理的是同一个对象的代理的问题
// import { reactive } from './reactive'
// const obj = {
//   a: 1,
//   b: 2
// }
// const state1 = reactive(obj)
// const state2 = reactive(obj)
//需要处理，否则两个proxy是不相等的
// console.log(state1 === state2) // false

//如果对以及代理的对象再次进行代理
// import { reactive } from './reactive'
// const obj = {
//   a: 1,
//   b: 2
// }
// const state1 = reactive(obj)
// const state2 = reactive(state1)
// console.log(state1 === state2) // true

//嵌套对象的问题
// import { reactive } from './reactive'

// const obj = {
//   a: 1,
//   b: 2,
//   get c() {
//     console.log('访问了c属性',this);
//     return this.a + this.b
//   }
// }
// const state = reactive(obj)
// function fn() {
//   state.c;
// }
// fn()
// //这里的this指向的是obj对象而不是state对象
// console.log(state.c) // 访问了c属性 3;

// import { reactive } from './reactive'
// const obj={
//   a:1,
//   b:2,
//   c:{
//     d:3
//   }
// }

// const state = reactive(obj)

// function fn(){
//   console.log('a' in state) // true;
// }
// fn()//这样this的指向是state对象

//细化记录收集和派发更新的问题
// import { reactive } from './reactive'
// const obj = {
//   a: 1,
//   b: 2,
//   c: {
//     d: 3
//   }
// };

// const state1 = reactive(obj);

// function fn() {
//   'e' in state1;
// }
// (state1 as any).e = 123;
// fn();

//测试记录收集和派发更新
// import { reactive } from './reactive'
// const obj = {
//   a: 1,
//   b: 2,
//   c: {
//     d: 3
//   }
// };
// const state1 = reactive(obj);
// function fn() {
//   //Object.keys(state1) // ['a', 'b', 'c']
// Object.keys(state1)
// }
// fn()
// state1.a = 2
// //@ts-ignore 这里因为只能对存在的属性进行赋值，所以会报错
// state1.e = 3
// // @ts-ignore 删除只能删除对象中可选的属性
// delete state1.a
// // @ts-ignore 删除对象中可选的属性
// delete state1.f 

// import { reactive } from './reactive'
// const arr = [ 3, 4, 5]
// const state = reactive(arr)
// function fn(){
//   state.indexOf(2)
// }
// fn()
// // console.log(state.indexOf(2)) // 1;

// / const obj = { a: 1, b: 2 };
// const arr1 = [3, obj, 5];
// const state1 = reactive(arr1);

// function fn() { 
//   const index = state1.lastIndexOf(obj);

//   console.log(arr1, obj);
//   console.log(state1[1], obj);
//   console.log(index);
// }
// fn();

// import { reactive } from "./reactive";

// 数组长度隐式更新的问题
// const arr1 = [1, 2, , 4, 5, 6];
// const state1 = reactive(arr1);

// function fn() { 
//   state1[0] = 99;
//   state1[2] = 100;
//   // 这里会触发数组长度length的隐式更新，所以我们自己的框架需要触发相关set更新
//   state1[10] = 77;
// }

// fn();

// 数组长度显式更新的问题
// const arr1 = [1, 2, 3, 4, 5, 6];
// const state1 = reactive(arr1);

// function fn() { 
//   // 如果数组长度的设置小于原来数组的长度，其实应该是两件事情
//   // oldLen 6
//   // newLen 3

//   // set length 3
//   // delete 3, 
//   // delete 4, 
//   // delete 5
//   state1.length = 3;
// }

// fn();

//对数组的push操作
// import { reactive } from "./reactive";
// const arr1 = [1, 2, 3, 4, 5, 6];
// const state1 = reactive(arr1);
// function fn() {
//   state1.push(7);
// }
// fn();

import { readonly } from "./reactive";

const obj = {
  a: 1,
  b: 2,
  c: {
    d: 3
  }
};
const readonlyObj = readonly(obj);
//readonly应该触发依赖收集

//对象的直接属性不能修改
// @ts-ignore
readonlyObj.a = 2
console.log(readonlyObj.a) // 1;

//嵌套的对象属性也不能修改
// @ts-ignore
readonlyObj.c.d = 4
console.log(readonlyObj.c.d) // 3;
