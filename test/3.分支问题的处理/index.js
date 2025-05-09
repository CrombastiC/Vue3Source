const layer = document.querySelector('#layer');
const btn = document.querySelector('#btn');
const btn2 = document.querySelector('#btn2');
const btnShow = document.querySelector('#btnShow');

const obj = {
  flag: true,
  name: "张三",
  age: 18,
}

const buckets = new WeakMap(); // 存储依赖
console.log(buckets)
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

  // 将上面deps 集合的内容挂载到activeEffect.deps
  activeEffect.deps.push(deps);
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
  // 为了避免无限循环，这里可以新建一个Set对象
  const effectsToRun = new Set(deps);
  effectsToRun.forEach(effect => effect());
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
function effect(fn) {
  const effectFn = () => {
    //当effectFn执行时，将其设置为当前激活的副作用函数
    activeEffect = effectFn;
    // 执行副作用函数
    fn();

  };

  //在effect函数上有挂载了deps数组，目的是在收集依赖的时候，可以临时记录依赖关系
  //在effect函数上挂载，其实就相当于在activeEffect上挂载了deps数组
  effectFn.deps = []; // 用于存储依赖
  effectFn(); // 立即执行副作用函数
}
