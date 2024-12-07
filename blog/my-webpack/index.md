# my-webpack 实验，简单写一个webpack

首先，无论是哪个打包工具，核心内容都是：输入输出、依赖解析、模块打包，所以..

先创个空文件夹，跑个 `npm init` 搞个仪式感..

我的初始 package.json belike:

```json
{
  "name": "test",
  "version": "1.0.0",
  "description": "just for test",
  "main": "index.js",
  "scripts": {
    "build": "node config.mjs"
  },
  "keywords": [
    "test"
  ],
  "author": "Yanko1013",
  "license": "ISC"
}
```

再创个 config.js 到目录，它和执行、配置相关，就准备开始啦。

初始目录结构大概是：

```text
my-webpack/
├── src/
│   ├── index.html
│   ├── main.js
│   └── utils.js
├── dist/
├── config.mjs
└── package.json
```

config.mjs 将作为打包的配置文件和程序入口，所以记得在 package.json 里写入 `"build": "node config.mjs"`。

## 打包目的

## 输入输出

## 依赖解析

## 模块打包

## 源码

[GitHub 个人仓库 my-webpack 源码]()

感谢阅读！如有错误，欢迎指正噢！
