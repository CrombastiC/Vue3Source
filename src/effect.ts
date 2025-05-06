export function track(target: object, key: unknown) {
console.log(`依赖收集：${key}属性被访问了`);
}

export function trigger(target: object, key: unknown) {

console.log(`触发更新：${key}属性被修改了`);
}
