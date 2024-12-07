import fs from 'fs'
import path from 'path'
import esprima from 'esprima'
import esquery from 'esquery'

class MyWebpack {
  constructor(baseDir, entryFile, outputPath, htmlTemplateFile, bundleName) {
    this.baseDir = baseDir
    this.entryFile = entryFile
    this.outputPath = outputPath
    this.htmlTemplateFile = htmlTemplateFile
    this.bundleName = bundleName

    // 生命周期状态，未来会加入 Loader, Plugin
    this.status = 'ready'
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
      this.status = 'beforeGetReference'
      const refMap = await this.getReference()

      // 第二步 扁平化依赖
      this.status = 'beforeFlattenReference'
      const refString = await this.flattenReference(refMap)

      // 第三步 代码转换、压缩
      this.status = 'beforeTranCode'
      const codeString = await this.tranCode(refString)

      // 第四步 输出新 js
      this.status = 'beforeOutputJs'
      await this.outputJs(codeString)

      // 第五步 输出 html
      this.status = 'beforeOutputHtml'
      await this.outputHtml()

      this.status = 'done'

    } catch(err) {
      this.status = 'failed'
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
    for(let i=0;i<imports.length;i++) {
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
    for(let i=0; i < refArr.length; i++) {
      const code = fs.readFileSync(refArr[i], 'utf-8');
      result = result.concat('\n', code)
    }

    return result
  }

  // 转成一个上下文；去除不必要符号和文本
  async tranCode(refString) {
    let res = ""
    const arr = refString.split('\n')

    for(let i=0; i<arr.length; i++) {
      const trim = arr[i].trim()
      let line = trim
      if(trim.startsWith('import')) {
        line = ''
      }
      if(trim.startsWith('//')) {
        line = ''
      }
      if(trim.startsWith('export')) {
        if(!trim.includes('function')) {
          line = ''
        } else {
          line = trim.replace(/^export\s+/, '')
        }
      }
      // 特殊处理：如果是 "document"，前面需要加个 ';'
      if(trim.startsWith('document')) {
        line = ';' + line
      }
      res += line.trim()
    }
    
    return res
  }

  // 创建 js 文件 把转换后的代码写入
  async outputJs(codeString) {
    const filePath = path.join(this.outputPath, this.bundleName)
    fs.writeFile(filePath, codeString, 'utf8', (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('');
      }
    })
  }

  async outputHtml() {
    const originalHtml = fs.readFileSync(this.htmlTemplateFile, 'utf-8');
    const entryFileName = this.entryFile.split('/').at(-1)
    
    // todo: 正则
    let handledHtml = originalHtml.replace(entryFileName, this.bundleName)
    const filePath = path.join(this.outputPath, 'index.html')

    fs.writeFile(filePath, handledHtml, 'utf8', (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log('');
      }
    })
  }
}

// 自定义
const baseDir = './src'
const entryFile = './src/main.js'
const outputPath = './dist'
const htmlTemplateFile = './src/index.html'
const bundleName = 'index.js'

const myWebpack = new MyWebpack(baseDir, entryFile, outputPath, htmlTemplateFile, bundleName)
myWebpack.run()
