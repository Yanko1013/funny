# my-webpack 实验，简单写一个webpack

首先，无论是哪个打包工具，核心内容都是：输入输出、依赖解析、模块打包，所以..

先创个空文件夹，跑个 `npm init` 搞个仪式感..

我的 package.json belike:

```json
{
  "name": "test",
  "version": "1.0.0",
  "description": "just for test",
  "main": "index.js",
  "scripts": {
    "build": "node config.js"
  },
  "keywords": [
    "test"
  ],
  "author": "Yanko1013",
  "license": "ISC"
}
```

再创个 config.js 到目录，它和执行、配置相关，就准备开始啦。

目录结构可以提前剧透下，大概是：

```text
my-webpack/
├── src/
│   ├── main.js
│   └── utils.js
├── dist/
├── config.js
└── package.json
```

## 输入输出

建立个 `src/main.js` 作为入口，很学院派。依赖的话...再弄个 `src/utils.js` export 一个简单函数，那么我写成这样（经典 Hello World）：

src/main.js:

```js
import Hello from './utils.js';

const hello = new Hello('World')

hello.sayHello()
```

src/utils.js

```js
class Hello {
  constructor(target) {
    this.target = target
  }

  sayHello(target) {
    console.log(`Hello ${target}!`)
  }
}

export default Hello
```

这里我写了 Class，是突然想到可以搞点事，下文 Loader 拓展会提到 :D

输出的话，新建个 dist 目录就好。

## 依赖解析

众所周知，打包需要启动服务端，为什么？因为要使用文件读写功能。

文件读写，读和写什么？字符串！所以我在 `config.js` 先引入：

```js
```

## 模块打包

## 未来计划

试着做个拓展，加入 Loader 和 Plugin 功能，应该会在本月底（2024-12）实现且写篇博客？

## 源码

[GitHub 个人仓库 my-webpack 源码]()

感谢阅读！如有错误，欢迎指正噢！
