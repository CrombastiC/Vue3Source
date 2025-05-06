import {reactive} from './reactive'

const obj={
  a:1,
  b:2
}

const r = reactive(obj)
console.log(r.a) // 1
r.a = 3
