import fs from 'fs'
import path from 'path'

// 模拟输出 html 文件
export async function myHtmlWebpackPlugin(myWebpackInstance) {
  // 用 bind 处理 this 指向
  myWebpackInstance.done = createHtml.bind(myWebpackInstance)
}

async function createHtml() {
  const originalHtml = fs.readFileSync(this.htmlTemplateFile, 'utf-8');
  const entryFileName = this.entryFile.split('/').at(-1)
  
  // todo: 正则
  let handledHtml = originalHtml.replace(entryFileName, this.bundleName)
  const filePath = path.join(this.outputPath, 'index.html')

  fs.writeFile(filePath, handledHtml, 'utf8', (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log('Succeed!');
    }
  })
}
