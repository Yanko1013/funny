// 转成一个上下文；去除不必要符号和文本
export async function tranCode(refString) {
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
