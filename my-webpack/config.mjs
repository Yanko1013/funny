import fs from 'fs'
import path from 'path'
import esprima from 'esprima'
import esquery from 'esquery'
import { myHtmlWebpackPlugin } from './extensions/plugin.mjs'
import { tranCode } from './extensions/loader.mjs'
import customize from './customize.json' assert { type: 'json' }

class MyWebpack {
  constructor(baseDir, entryFile, outputPath, htmlTemplateFile, bundleName) {
    this.baseDir = baseDir
    this.entryFile = entryFile
    this.outputPath = outputPath
    this.htmlTemplateFile = htmlTemplateFile
    this.bundleName = bundleName

    this.lifeCycle = this.initLifeCycle()
  }

  initLifeCycle() {
    const target = {
      status: 'pending',
      timeRecord: new Map()
    }
    const handler = {
      get(target, property) {
        return target[property]
      },
      // 记下各阶段开启时间
      set(target, property, value) {
        const curTime = performance.now()
        target.timeRecord.set(value, curTime)
        target[property] = value
        return true
      }
    }
    return new Proxy(target, handler)
  }

  getCostTime() {
    return Array.from(this.lifeCycle.timeRecord)
  }

  /**
   * 目标：
   * 1. 所有 js 变成一个 js
   * main.js     ├── index.js
   *  - utils.js │
   * 
   * 2. 创建新 html 文件，并应用新的 js 文件
   * 
   * 这只是我个人的想法哦，仅供参考
   */
  async run() {
    try {
      // 第一步 解析依赖
      this.lifeCycle.status = 'beforeGetReference'
      const refMap = await this.getReference()

      // 第二步 扁平化依赖
      this.lifeCycle.status = 'beforeFlattenReference'
      const refString = await this.flattenReference(refMap)

      // 第三步 代码转换、压缩。应用 Loader
      this.lifeCycle.status = 'beforeTranCode'
      const codeString = await applyLoaders(refString)

      // 第四步 输出新 js
      this.lifeCycle.status = 'beforeOutputJs'
      await this.outputJs(codeString)

      // 第五步 收尾，应用 plugin
      this.lifeCycle.status = 'beforeDone'
      await this.done()

      this.lifeCycle.status = 'done'

    } catch (err) {
      console.error(err)
    }
  }

  async getReference() {
    const map = new Map()
    // 想法是，以 entryFile 作为key，值为本文件引用的依赖
    // Map<string, string[]>
    const refArray = await this.getRefByArray(this.entryFile)
    map.set(this.entryFile, refArray)
    return map
  }

  // 递归找依赖
  // 用了 esprima 解析 js -> ast ; esquery 查询 ast
  async getRefByArray(filePath) {
    let refArray = new Array()
    refArray.push(filePath)

    const code = fs.readFileSync(filePath, 'utf-8'); // string
    const ast = esprima.parseModule(code); // object
    const importDeclarations = esquery(ast, 'ImportDeclaration'); // array

    // 本层的 import
    const imports = importDeclarations.map(declaration => declaration.source.value);
    // 递归
    for (let i = 0; i < imports.length; i++) {
      const importPath = imports[i]
      const fullPath = path.join(baseDir, path.basename(importPath))
      const result = await this.getRefByArray(fullPath)
      refArray.push(result)
    }

    return refArray
  }

  // 扁平，代码全部归到一个文件
  async flattenReference(refMap) {
    let refArr = refMap.get(this.entryFile)
    refArr = refArr.flat(refArr.length)
    // 反转一下，让依赖排前面，避免找不到
    refArr = refArr.reverse()

    let result = ''
    for (let i = 0; i < refArr.length; i++) {
      const code = fs.readFileSync(refArr[i], 'utf-8');
      result = result.concat('\n', code)
    }

    return result
  }

  // 创建 js 文件 把转换后的代码写入
  async outputJs(codeString) {
    const filePath = path.join(this.outputPath, this.bundleName)
    fs.writeFile(filePath, codeString, 'utf8', (err) => {
      if (err) {
        console.error(err);
      }
    })
  }

  async done() { }
}

// 导入配置
const {
  baseDir,
  entryFile,
  outputPath,
  htmlTemplateFile,
  bundleName
} = customize

const myWebpack = new MyWebpack(baseDir, entryFile, outputPath, htmlTemplateFile, bundleName)

// 装载 loader
// 目前只有一个 Loader，未来更新会试着写多几个。
async function applyLoaders(codeString) {
  return await tranCode(codeString)
  /* ...more loader... */
}

// 装载 plugin
myHtmlWebpackPlugin(myWebpack)

await myWebpack.run()

console.log(myWebpack.getCostTime())
