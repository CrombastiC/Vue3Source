const layer = document.querySelector('#layer');
const btn = document.querySelector('#btn');

const obj = {
  name: '张三',
  age: 25
}
//依赖树 使用weakmap的原因是为了防止内存泄漏 同时有更好的gc
const buckets = new WeakMap();

const handler = {
  get(target, key, receiver) {
    track(target, key);
    const result = Reflect.get(target, key, receiver);


    return result;

  },
  set(target, key, value, receiver) {

    const result = Reflect.set(target, key, value, receiver);
    trigger(target, key);
    //4.返回结果
    return result;
  }
}

function track(target, key) {
  if (!activeEffect) return;
  //1.根据target从buckets中获取depsmap，它是一个map对象，保存类型是key--effects的键值对
  let depsMap = buckets.get(target);
  //如果没有就创建一个新的map对象
  if (!depsMap) {
    buckets.set(target, (depsMap = new Map()));
  }
  //2.根据key从depsMap中获取deps，它是一个set对象，保存副作用函数
  let deps = depsMap.get(key);
  //如果没有就创建一个新的set对象
  if (!deps) {
    depsMap.set(key, (deps = new Set()));
  }
  //3.将activeEffect添加到deps中
  deps.add(activeEffect);
}
function trigger(target, key) {
//1.根据target从buckets中获取depsmap
    let depsMap = buckets.get(target);
    //如果depsMap不存在，直接返回
    if (!depsMap) return;
    //2.根据key从depsMap中获取effects
    let deps = depsMap.get(key);
    //如果deps不存在，直接返回
    if (!deps) return;
    //3.遍历deps，执行副作用函数
    deps.forEach(fn => fn());
}
// 代理对象
const proxy = new Proxy(obj, handler);
//使用全局变量存储需要被收集的副作用函数
let activeEffect;
function effect(fn) {
  // 将副作用函数存储到全局变量中
  activeEffect = fn;
  // 触发依赖收集
  fn();
}

effect(function effectFn() {
  console.log('fn');
  layer.innerHTML = proxy.name;
});// 触发依赖收集

btn.addEventListener('click', function () {
  proxy.name = '李四';

}
)
