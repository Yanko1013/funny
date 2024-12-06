class Hello {
  constructor(target) {
    this.target = target
  }

  sayHello() {
    console.log(`Hello ${this.target}!`)
  }
}

export default Hello