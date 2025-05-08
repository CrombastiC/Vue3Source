import { TrackOpTypes,TriggerOpTypes } from "./operation";
//是否进行依赖收集的开关
let shouldTrack = true

export function pauseTracking() {
  shouldTrack = false
}

export function enableTracking() {
  shouldTrack = true
}

export function track(target: object,type:TrackOpTypes, key: unknown) {
  if (!shouldTrack) return;
  console.log(`%c依赖收集；【${type}】${String(key)}`, 'color:#f40');
}

export function trigger(target: object, type: TriggerOpTypes, key: unknown) {

  console.log(`%c触发更新；【${type}】${String(key)}`, 'color:#0f0');
}
