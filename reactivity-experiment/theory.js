let activeEffect = null

// WeakMap<target, Map<key, Set<effect>>>
const GlobalSubMap = new WeakMap()

export function computed(fn) {
  return {
    get value() {
      activeEffect = fn
      const res = fn()
      activeEffect = null
      return res
    }
  }
}

function track(target, key) {
  // 若当前正在进行 effect，需要将其加入订阅
  if (activeEffect) {
    if (!GlobalSubMap.has(target)) {
      const dep = new Map()
      const set = new Set()
      dep.set(key, set)
      GlobalSubMap.set(target, dep)
    }

    const effects = GlobalSubMap.get(target).get(key)
    
    effects.add(activeEffect)
  }
}

function trigger(target, key) {
  // 通知 target 的所有订阅者事情，自身已更改值
  if (GlobalSubMap.has(target)) {
    const effects = GlobalSubMap.get(target).get(key)
    effects.forEach((effect) => effect())
  }
}

/*
  1. 变量被读取时，开启追踪
  2. 追踪：若某 effect 有读取变量，设置该 effect 为订阅者
  3. 变量被赋值，通知所有订阅者
*/
export function ref(value) {
  const refObject = {
    _value: value,

    get value() {
      track(refObject, 'value')
      return refObject._value
    },

    set value(newValue) {
      if (newValue !== refObject._value) {
        refObject._value = newValue
        trigger(refObject, 'value')
      }
    }
  }
  return refObject
}
