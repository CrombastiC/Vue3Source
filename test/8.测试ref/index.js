// 自定义守卫，`形参 is 类型`的语法结构
const isObject = (val) => {
  return val !== null && typeof val === "object";
};
const isString = (val) => {
  return typeof val === "string";
};
const isFunction = (val) => {
  return typeof val === "function";
};
// 空函数
const NOOP = () => {};
const isArray = Array.isArray;
const isPromise = (val) => {
  return isObject(val) && isFunction(val.then) && isFunction(val.catch);
};
// 通过Object.is来判断两个值是否相等,框架可以避免一些特殊情况
// 比如NaN和NaN是相等的，而Object.is(NaN, NaN)是true
// +0和-0是不相等的，而Object.is(+0, -0)是false
const hasChanged = (value, oldValue) => {
  return !Object.is(value, oldValue);
};
const isSymbol = (val) => {
  return typeof val === "symbol";
};
const extend = Object.assign;
// 判断一个key是否是一个合法的整数类型的字符串
const isIntegerKey = (key) => {
  return (
    isString(key) && // 检查key是否是字符串
    key !== "NaN" && // 确保key不是NaN字符串
    key[0] !== "-" && // 确保key不是负数
    "" + parseInt(key, 10) === key
  ); // 确保key是一个可以被转换为整数的合法字符串
};
const hasOwnProperty = Object.prototype.hasOwnProperty;
const hasOwn = (
  val, // 判断的对象
  key // 判断的key
) => hasOwnProperty.call(val, key);

const ITERATE_KEY$1 = Symbol("");
function isEffect(fn) {
  return fn && fn._isEffect === true;
}
let activeEffect;
let effectStack = [];
let targetMap = new WeakMap();
let shouldTrack = true;
function pauseTracking() {
  shouldTrack = false;
}
function enableTracking() {
  shouldTrack = true;
}
function track(target, type, key) {
  // 暂停依赖收集开关，没有activeEffect或者shouldTrack为false时，不进行依赖收集
  if (!shouldTrack || activeEffect === undefined) {
    return;
  }
  console.log(`依赖收集：【${type}】 ${String(key)}属性被读取了`);
  // 1. 根据target从buckets中获取对应的Map，保存的类型是key---effects的键值对
  let depsMap = targetMap.get(target);
  // 如果depsMap不存在，则初始化一个depsMap
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
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
function trigger(target, type, key, newValue, oldValue) {
  console.log(`触发更新：【${type}】 ${String(key)}属性被修改了`);
  // 根据target从buckets中获取对应的depsMap
  const depsMap = targetMap.get(target);
  // 如果depsMap不存在，则直接返回
  if (!depsMap) {
    return;
  }
  // 根据key从depsMap中获取对应的deps----> effects
  const deps = depsMap.get(key);
  // 依次执行deps中的副作用函数
  // 为了避免无限循环，这里可以新建一个Set对象
  const effects = new Set();
  const add = (effectsToAdd) => {
    if (effectsToAdd) {
      effectsToAdd.forEach((effect) => {
        if (effect !== activeEffect) {
          effects.add(effect);
        }
      });
    }
  };
  if (key === "length" && isArray(target)) {
    depsMap.forEach((dep, key) => {
      if (key === "length" || key >= newValue) {
        add(dep);
      }
    });
  } else {
    // 在vue3源码中使用void 0 替代undefined
    // 在框架中需要避免一些极端情况，比如ES5之前，undefined不是一个保留字，是可以被重写的
    if (key !== void 0) {
      add(depsMap.get(key));
    }
    // ADD 操作 会影响for...in循环迭代，也会隐式的影响数组长度，这些都需要触发更新
    // DELETE 操作 会影响for...in循环迭代,需要触发更新
    // 注意 delete arr[1],只是设置数组的值为undefined，并不会触发数组长度的更新
    switch (type) {
      case "ADD" /* TriggerOpTypes.ADD */:
        // 如果不是数组，说明是需要迭代的对象
        if (!isArray(target)) {
          add(depsMap.get(ITERATE_KEY$1));
        }
        // key是一个整数类型的字符串,证明是数组，需要触发length属性
        else if (isIntegerKey(key)) {
          add(depsMap.get("length"));
        }
        break;
      case "DELETE" /* TriggerOpTypes.DELETE */:
        // 如果不是数组，说明是需要迭代的对象
        if (!isArray(target)) {
          add(depsMap.get(ITERATE_KEY$1));
        }
        break;
    }
  }
  effects.forEach((effect) => {
    if (effect.options.scheduler) {
      effect.options.scheduler(effect);
    } else {
      effect();
    }
  });
}
function createReactiveEffect(fn, options = {}) {
  const effect = function reactiveEffect() {
    if (!effectStack.includes(effect)) {
      // 先进行清理
      cleanup(effect);
      try {
        // 当effectFn执行时，将其设置为当前激活的副作用函数
        activeEffect = effect;
        // 在调用副作用函数之前，将其压入effectStack栈中
        effectStack.push(effect);
        // 执行副作用函数,结果保存在res中
        const res = fn();
        // 返回结果
        return res;
      } finally {
        // 在调用副作用函数之后，将其从effectStack栈中弹出
        effectStack.pop();
        // activeEffect始终指向当前effectStack栈顶的副作用函数
        activeEffect = effectStack[effectStack.length - 1];
      }
    }
  };
  // 将options挂载到effectFn上
  effect.options = options;
  // 在effectFn函数上又挂载了deps数组，目的是在收集依赖时可以临时记录依赖关系
  // 在effectFn函数上挂载，其实就相当于挂载在activeEffect
  effect.deps = [];
  // 如果发生了effect嵌套，直接将内部的fn函数给到effect.raw
  effect._isEffect = true;
  effect.raw = fn;
  return effect;
}
function effect(fn, options = {}) {
  // 如果fn是一个副作用函数，则直接取其raw属性
  if (isEffect(fn)) {
    fn = fn.raw;
  }
  // 创建一个副作用函数
  const effect = createReactiveEffect(fn, options);
  // 只有非lazy的情况，才会立即执行副作用函数
  if (!options.lazy) {
    effect();
  }
  // 将副作用函数作为返回值返回
  return effect;
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

// 用来表示对象的"迭代依赖"标识
const ITERATE_KEY = Symbol("");
const builtInSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map((key) => Symbol[key])
    .filter(isSymbol)
);
// 通过对象存储改动之后的数组方法，进行统一管理
const arrayInstrumentations = {};
["includes", "indexOf", "lastIndexOf"].forEach((key) => {
  // 首先获取原生方法的引用
  const method = Array.prototype[key];
  arrayInstrumentations[key] = function (...args) {
    // 首先将this转化为非响应式(代理)对象
    const arr = toRaw(this);
    // 遍历当前数组的每个索引，通过track函数对数组索引进行依赖收集
    for (let i = 0, l = this.length; i < l; i++) {
      track(arr, "GET" /* TrackOpTypes.GET */, i + "");
    }
    // 直接在原始对象中查找,使用原始数组和参数
    const res = method.apply(arr, args);
    if (res === -1 || res === false) {
      // 如果在原始数组中没有找到，注意，还需要进行处理，因为参数也有可能是响应式的
      return method.apply(arr, args.map(toRaw));
    } else {
      return res;
    }
  };
});
["push", "pop", "shift", "unshift", "splice"].forEach((key) => {
  // 获取到原生的方法
  const method = Array.prototype[key];
  arrayInstrumentations[key] = function (...args) {
    pauseTracking();
    const res = method.apply(this, args);
    enableTracking();
    return res;
  };
});
function createGetter(isReadonly = false, shallow = false) {
  return function get(target, key, receiver) {
    if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
      return true;
    } else if (key === "__v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
      return isReadonly;
    } else if (
      key === "__v_raw" /* ReactiveFlags.RAW */ && // 当代理对象访问__v_raw属性时，返回原始对象
      receiver === (isReadonly ? readonlyMap : reactiveMap).get(target) // 确保请求原始对象的访问是代理对象发起的
    ) {
      return target;
    }
    const targetIsArray = isArray(target);
    if (targetIsArray && arrayInstrumentations.hasOwnProperty(key)) {
      return Reflect.get(arrayInstrumentations, key, receiver);
    }
    // 返回对象的相应属性值
    const result = Reflect.get(target, key, receiver);
    const keyIsSymbol = isSymbol(key);
    if (keyIsSymbol ? builtInSymbols.has(key) : key === "__proto__") {
      return result;
    }
    // todo: 收集依赖
    // 只有非只读的才会进行依赖收集
    if (!isReadonly) {
      track(target, "GET" /* TrackOpTypes.GET */, key);
    }
    // 如果只是浅层代理，直接返回结果
    if (shallow) {
      return result;
    }
    // 如果是对象，再次进行递归代理
    if (isObject(result)) {
      return isReadonly ? readonly(result) : reactive(result);
    }
    return result;
  };
}
function createSetter(shallow = false) {
  return function set(target, key, value, receiver) {
    let oldValue = target[key];
    // 判断动作是ADD还是SET
    // 如果目标是数组，并且key是一个有效的数组索引，需要判断key是否小于数组长度
    // 如果目标是普通对象或者其他非数组对象，判断对象是否有这个key
    // const hadKey = 如果是数组，并且key是一个有效的数组索引 ？
    //    key 是否小于数组的长度(小于Set操作，大于Add操作)
    //    : 不是数组直接判断是否有这个key属性(有Set操作，没有Add操作)
    const hadKey =
      isArray(target) && isIntegerKey(key)
        ? Number(key) < target.length
        : hasOwn(target, key);
    const result = Reflect.set(target, key, value, receiver);
    if (target === toRaw(receiver)) {
      if (!hadKey) {
        // ADD操作
        trigger(target, "ADD" /* TriggerOpTypes.ADD */, key, value);
      } else if (hasChanged(value, oldValue)) {
        // SET操作
        trigger(target, "SET" /* TriggerOpTypes.SET */, key, value, oldValue);
      }
    }
    return result;
  };
}
const get = /*#__PURE__*/ createGetter();
const readonlyGet = /*#__PURE__*/ createGetter(true);
const shallowGet = /*#__PURE__*/ createGetter(false, true);
const shallowReadonlyGet = /*#__PURE__*/ createGetter(true, true);
const set = /*#__PURE__*/ createSetter();
const shallowSet = /*#__PURE__*/ createSetter(true);

function has(target, key) {
  // todo: 收集依赖
  track(target, "HAS" /* TrackOpTypes.HAS */, key);
  const result = Reflect.has(target, key);
  return result;
}
function ownKeys(target) {
  // 依赖收集
  track(target, "ITERATE" /* TrackOpTypes.ITERATE */, ITERATE_KEY);
  return Reflect.ownKeys(target);
}
function deleteProperty(target, key) {
  // 删除也判断是否属性存在
  const hadKey = target.hasOwnProperty(key);
  // 删除的结果
  const result = Reflect.deleteProperty(target, key);
  // 对象有这个属性，并且删除成功，触发更新
  if (hadKey && result) {
    trigger(target, "DELETE" /* TriggerOpTypes.DELETE */, key);
  }
  return result;
}
const mutableHandlers = {
  get,
  set,
  has,
  ownKeys,
  deleteProperty,
};
const readonlyHandlers = {
  get: readonlyGet,
  set(target, key) {
    console.warn(
      `Set operation on key "${String(key)}" failed: target is readonly.`,
      target
    );
    return true;
  },
  deleteProperty(target, key) {
    console.warn(
      `Delete operation on key "${String(key)}" failed: target is readonly.`,
      target
    );
    return true;
  },
};
const shallowReactiveHandlers = extend({}, mutableHandlers, {
  get: shallowGet,
  set: shallowSet,
});

// 为了区分普通代理reactive和readonly,我们分开进行存储
const reactiveMap = new WeakMap();
const readonlyMap = new WeakMap();
function createReactiveObject(target, isReadonly, baseHandlers) {
  // 如果target不是对象，直接返回
  if (!isObject(target)) {
    return target;
  }
  // 如果是已经代理过的对象，就不需要再进行代理了
  const proxyMap = isReadonly ? readonlyMap : reactiveMap;
  const existingProxy = proxyMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }
  // 判断是否是响应式对象
  if (
    target["__v_raw" /* ReactiveFlags.RAW */] &&
    target["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */]
  ) {
    return target;
  }
  const proxy = new Proxy(target, baseHandlers);
  proxyMap.set(target, proxy);
  return proxy;
}
function reactive(target) {
  if (target && target["__v_isReadonly" /* ReactiveFlags.IS_READONLY */]) {
    return target;
  }
  return createReactiveObject(target, false, mutableHandlers);
}
function readonly(target) {
  return createReactiveObject(target, true, readonlyHandlers);
}
function toRaw(observed) {
  return observed["__v_raw" /* ReactiveFlags.RAW */] || observed;
}
function shallowReactive(target) {
  return createReactiveObject(target, false, shallowReactiveHandlers);
}

const layer1 = document.querySelector("#layer1");
const btn1 = document.querySelector("#btn1");

function ref(value) {
  const wrapper = {
    value,
  };

  Object.defineProperty(wrapper, '__v_isRef', {
    value: true,
    writable: false,
  })

  return reactive(wrapper);
}

function toRef(obj, key) { 
  const wrapper = {
    get value() {
      return obj[key];
    },
    set value(newVal) {
      obj[key] = newVal;
    }
  };

  Object.defineProperty(wrapper, '__v_isRef', {
    value: true,
    writable: false,
  })

  return wrapper;
}

function toRefs(obj) { 
  const ret = {};
  for (const key in obj) {
    ret[key] = toRef(obj, key);
  }
  return ret;
}


function proxyRefs(target) { 
  return new Proxy(target, {
    get(target, key, receiver) {
      const result = Reflect.get(target, key, receiver);
      return result.__v_isRef ? result.value : result;
    },
    set(target, key, value, receiver) { 
      const oldValue = target[key];
      if (oldValue && oldValue.__v_isRef) {
        oldValue.value = value;
        return true;
      }
      else { 
        return Reflect.set(target, key, value, receiver);
      }
    }
  })
}


/**
 * const component = {
 *  setup(){
 * 
 *   const count = ref(1);
 * 
 *  return {
 *    count
 *  }
 * 
 * }
 */

// const ref1 = ref(1);
// const ref2 = reactive({value:1})

// function fn() { 
//   console.log("执行了函数fn");
//   layer1.innerHTML = ref1.value;
// }

// effect(fn);

// btn1.addEventListener("click", () => { 
//   ref1.value++;
// })


// 响应丢失问题
// const obj = {
//   name: "jack",
//   age: 18,
//   addr: {
//     province: "四川",
//     city: "成都"
//   }
// }

// const stateObj = reactive(obj);
// let deObj = { ...stateObj }


// const newObj = {
//   name: {
//     get value() { 
//       return stateObj.name;
//     }
//   },
//   age: {
//     get value() { 
//       return stateObj.age;
//     }
//   }
// }

// const newObj = {
//   name: toRef(stateObj, "name"),
//   age: toRef(stateObj, "age"),
// }

// const newObj = { ...toRefs(stateObj) };

// console.log(stateObj, deObj)

// function fn() { 
//   console.log("执行了函数fn");
//   layer1.innerHTML = newObj.name.value;
// }

// effect(fn);

// btn1.addEventListener("click", () => { 
//   stateObj.name = "tom";
// })


// 自动脱ref的情况
// ref帮我们处理了简单值处理和响应式丢失的问题，但是会带来新的问题
// 我们访问的时候，必须要使用xxx.value
// 如果在界面的代码中，还必须使用这种方式，那么就会很麻烦
const obj = {
  name: "jack",
  age: 18,
  addr: {
    province: "四川",
    city: "成都"
  }
}
const stateObj = reactive(obj);

const newObj = { ...toRefs(stateObj) };
const deNewObj = proxyRefs({ ...toRefs(stateObj) });

console.log(deNewObj.name, deNewObj.age)
console.log(newObj.name.value, newObj.age.value)
