const layer =document.querySelector('#layer');
const btn=document.querySelector('#btn');

const obj={
  name:'张三',
  age: 25
}
//依赖树
const buckets=new Set();

const handler={
  get(target,key,receiver){
    buckets.add(key);
    const result = Reflect.get(target,key,receiver);
    return result;

  },
  set(target,key,value,receiver){
    console.log('set');
    const result = Reflect.set(target,key,value,receiver);
    buckets.forEach(effect=>effect());
    return result;
  }
}
// 代理对象
const proxy = new Proxy(obj,handler);
// 代理对象的属性值发生变化时，触发依赖收集
function effect(){
  layer.innerHTML=proxy.name
}

effect();// 触发依赖收集

btn.addEventListener('click',function(){
  proxy.name='李四';

}
)
