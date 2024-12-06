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

建立个 `src/main.js` 作为入口，很学院派。依赖的话...再弄个 `src/utils.js` export 一个简单函数，那么我大概写成这样：

src/main.js:

```js
import { sayHello } from './utils.js';

sayHello("World");
```

src/utils.js

```js
export function sayHello(target) {
  console.log(`Hello ${target}!`)
}
```

## 依赖解析

## 模块打包

## 拓展——Loader

## 拓展——Plugin

## 源码
