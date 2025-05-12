const layer1 = document.querySelector("#layer1");
const layer2 = document.querySelector("#layer2");
const btn1 = document.querySelector("#btn1");
const btn2 = document.querySelector("#btn2");

const obj = {
  flag: true,
  name: "张三",
  age: 18,
};

const buckets = new WeakMap(); // 存储依赖
function track(target, key) {
  // 如果没有注册的副作用函数，直接返回
  if (!activeEffect) {
    return;
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
    return;
  }

  // 根据key从depsMap中获取对应的deps----> effects
  const deps = depsMap.get(key);

  // 依次执行deps中的副作用函数
  // 为了避免无限循环，这里可以新建一个Set对象
  const effectsToRun = new Set();

  deps &&
    deps.forEach((effectFn) => {
      // 如果当前副作用函数不是当前激活的副作用函数，才将其添加到effectsToRun中
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn);
      }
    });

  // 取得与ITERATE_KEY相关的副作用函数
  const iterateEffects = depsMap.get(ITERATE_KEY);

  // 将与ITERATE_KEY相关的副作用函数也添加到effectsToRun中
  iterateEffects &&
    iterateEffects.forEach((effectFn) => {
      if (effectFn !== activeEffect) {
        effectsToRun.add(effectFn);
      }
    });

  effectsToRun.forEach((effect) => { 
    if (effect.options.scheduler) {
      effect.options.scheduler(effect);
    }
    else { 
      effect();
    }
  });
}

const ITERATE_KEY = Symbol("");

const handler = {
  get(target, key, receiver) {
    track(target, key);
    const result = Reflect.get(target, key, receiver);
    return result;
  },
  set(target, key, value, receiver) {
    const result = Reflect.set(target, key, value, receiver);
    trigger(target, key);

    return result;
  },
  ownKeys(target) {
    track(target, ITERATE_KEY);
    return Reflect.ownKeys(target);
  },
};

const proxy = new Proxy(obj, handler);

// 用全局变量存储要被收集的副作用函数
let activeEffect = null;

const effectStack = [];

// effect 改成一个副作用函数的注册机
function effect(fn, options = {}) {
  const effectFn = () => {
    // 先进行清理
    cleanup(effectFn);
    // 当effectFn执行时，将其设置为当前激活的副作用函数
    activeEffect = effectFn;

    // 在调用副作用函数之前，将其压入effectStack栈中
    effectStack.push(effectFn);

    // 执行副作用函数,结果保存在res中
    const res = fn();

    // 在调用副作用函数之后，将其从effectStack栈中弹出
    effectStack.pop();

    // activeEffect始终指向当前effectStack栈顶的副作用函数
    activeEffect = effectStack[effectStack.length - 1];

    // 返回结果
    return res;
  };

  // 将options挂载到effectFn上
  effectFn.options = options;

  // 在effectFn函数上又挂载了deps数组，目的是在收集依赖时可以临时记录依赖关系
  // 在effectFn函数上挂载，其实就相当于挂载在activeEffect
  effectFn.deps = [];

  // 只有非lazy的情况，才会立即执行副作用函数
  if (!options.lazy) { 
    effectFn();
  }

  // 将副作用函数作为返回值返回
  return effectFn;
  
}

function cleanup(effect) {
  const { deps } = effect;
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect);
    }
    deps.length = 0;
  }
}

// 自定义调度器
let isFlushing = false;
// 用set集合来存储副作用函数，使用Set是因为Set不允许有重复的值，
// 这样可以保证同一个副作用函数不会重复被添加到队列中
const jobQueue = new Set();

const p = Promise.resolve();

function flushJob() { 
  if (isFlushing) { 
    return;
  }

  isFlushing = true;

  p.then(() => { 
    jobQueue.forEach((job) => job());
  })
    .finally(() => { 
      isFlushing = false;
    })
}

function computed(getterOrOptions) { 
  let value;
  // dirty标志，用来标识是否需要重新计算，初始值为true，表示需要重新计算
  let dirty = true;
  const effectFn = effect(getterOrOptions, {
    lazy: true,
    scheduler: () => { 
      dirty = true;
    }
  })

  const obj = {
    get value() { 
      if (dirty) { 
        console.log("---obj.value---");
        value = effectFn();
        dirty = false;
      }
      return value;
    }
  }

  return obj
}

const res = computed(() => proxy.age + 10);
console.log(res.value)
proxy.age++;
console.log(res.value)
proxy.age++;
console.log(res.value)


// const effectFn = effect(() => {
//   layer2.innerHTML = proxy.age;
//   return proxy.age + 10;
// }, {
//   lazy: true
// })

// const value = effectFn();
// console.log(value)
