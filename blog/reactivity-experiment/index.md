<!-- TODO -->

# 模拟 vue3 响应性实验

> 推荐阅读：[深入响应式系统](https://cn.vuejs.org/guide/extras/reactivity-in-depth)

众所周知，响应式的核心原理是`数据劫持`、`依赖收集`、`派发更新`，本文将实现简化版的 ref、reactive。

## 原理

### 数据劫持

### 依赖收集

### 派发更新

## 代码

```js
let activeEffect = null
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
  if (GlobalSubMap.has(target)) {
    const effects = GlobalSubMap.get(target).get(key)
    effects.forEach((effect) => effect())
  }
}

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

export function reactive(obj) {
  return new Proxy(obj, {
    get(target, key) {
      track(target, key)
      return Reflect.get(target, key)
    },
    set(target, key, value) {
      const res = Reflect.set(target, key, value)
      trigger(target, key)
      return res
    }
  })
}
```
