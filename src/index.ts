// import {reactive} from './reactive'

// const obj={
//   a:1,
//   b:2
// }

// const r = reactive(obj)
// console.log(r.a) // 1
// r.a = 3

//如果代理的是同一个对象的代理
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

import { reactive } from './reactive'
const obj={
  a:1,
  b:2,
  c:{
    d:3
  }
}

const state = reactive(obj)

function fn(){
  console.log('a' in state) // true;
}
fn()//这样this的指向是state对象
