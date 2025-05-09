const layer = document.querySelector('#layer');
const btn = document.querySelector('#btn');

const obj = {
  name: "张三",
  age: 18,
  city: "上海"
}

const buckets = new WeakMap(); // 存储依赖

function track(target, key) { 
  // 如果没有注册的副作用函数，直接返回
  if (!activeEffect) { 
    return result;
  }

  // 1. 根据target从buckets中获取对应的Map，保存的类型是key---effects的键值对
  let depsMap = buckets.get(target);
  // 如果depsMap不存在，则初始化一个depsMap
  if (!depsMap) { 
    buckets.set(target, (depsMap = new Map()));
  }

  // 2.根据key从depsMap中获取对应的Set，保存的是副作用函数
  let deps = depsMap.get(key);
  if (!deps) { 
    depsMap.set(key, (deps = new Set()));
  }

  // 3.将副作用函数添加到deps中
  deps.add(activeEffect);
}

function trigger(target, key) { 
  // 根据target从buckets中获取对应的depsMap
  const depsMap = buckets.get(target);
  // 如果depsMap不存在，则直接返回
  if (!depsMap) { 
    return result;
  }

  // 根据key从depsMap中获取对应的deps----> effects
  const deps = depsMap.get(key);
  // 如果deps不存在，则直接返回
  if (!deps) { 
    return result;
  }

  // 依次执行deps中的副作用函数
  deps.forEach(effect => effect());
}

const handler = {
  get(target, key, receiver) { 
    track(target, key)
    const result = Reflect.get(target, key, receiver);
    return result;
  },
  set(target, key, value, receiver) { 
    const result = Reflect.set(target, key, value, receiver);
    trigger(target, key);
    
    return result;
  }
}

const proxy = new Proxy(obj, handler);

// 用全局变量存储要被收集的副作用函数
let activeEffect = null;

// effect 改成一个副作用函数的注册机
function effect(fn) { 
  // 当调用effect函数是，将fn赋值给activeEffect
  activeEffect = fn;
  // 执行fn函数
  fn();
}

// 副作用函数与被操作的目标字段之间没有建立明确的关系
effect(function effectFn() { 
  console.log("fn")
  layer.innerHTML = proxy.city;
  
});

btn.addEventListener('click', () => {
  // proxy.name = "李四";
  // proxy.city没有被依赖收集，不应该再次被触发副作用函数
  proxy.city = "北京";
});