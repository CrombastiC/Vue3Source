const obj = {
  a: 1,
  b: 2
}

const proxy = new Proxy({ a: 1, b: 2 }, {
  get(target, key) { 
    console.log('get', key)
    if (key === 'c') { 
      return true;
    }
    return target[key]
  }
})

// console.log(obj.a) // 1
// console.log(proxy.a) // get a 1

// console.log(obj.c)
console.log(proxy.c)