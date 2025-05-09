const layer = document.querySelector('#layer');
const btn = document.querySelector('#btn');

const obj = {
  name: "张三",
  age: 18
}

const buckets = new Set(); // 存储依赖

const handler = {
  get(target, key, receiver) { 
    console.log("get")
    buckets.add(effect);
    const result = Reflect.get(target, key, receiver);
    return result;
  },
  set(target, key, value, receiver) { 
    console.log("set")
    const result = Reflect.set(target, key, value, receiver);
    buckets.forEach(effect => effect());
    return result;
  }
}

const proxy = new Proxy(obj, handler);

function effect() { 
  layer.innerHTML = proxy.name;
}

effect(); // 依赖收集

btn.addEventListener('click', () => {
  proxy.name = "李四";
});