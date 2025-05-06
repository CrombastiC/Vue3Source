import { TrackOpTypes,TriggerOpTypes } from "./operation";
export function track(target: object,type:TrackOpTypes, key: unknown) {
console.log(`%c依赖收集；【${type}】${String(key)}`, 'color:#f40');
}

export function trigger(target: object, type: TriggerOpTypes, key: unknown) {

  console.log(`%c触发更新；【${type}】${String(key)}`, 'color:#0f0');
}
