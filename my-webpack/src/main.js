import Hello from './utils.js'

export function runClick() {
  const hello = new Hello('World')
  document.querySelector('p').innerHTML =  hello.sayHello()
}
// 挂载 window
window.runClick = runClick