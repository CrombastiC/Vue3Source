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
import { reactive } from './reactive'
const obj = {
  a: 1,
  b: 2,
  c: {
    d: 3
  }
};
const state1 = reactive(obj);
function fn() {
  //Object.keys(state1) // ['a', 'b', 'c']
Object.keys(state1)
}
fn()
state1.a = 2
//@ts-ignore 这里因为只能对存在的属性进行赋值，所以会报错
state1.e = 3
// @ts-ignore 删除只能删除对象中可选的属性
delete state1.a
// @ts-ignore 删除对象中可选的属性
delete state1.f 
