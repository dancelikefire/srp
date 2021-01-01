let ParsingStack =require('../tool/parsing-stack')

class GenerateParsingStack {
  constructor(grammar, PredictiveParsingTable, strToken) {
    this.grammar = grammar
    this.PredictiveParsingTable = PredictiveParsingTable
    this.end = this.grammar.getStackBottomSign()
    this.empty = this.grammar.getEmptySign()
    this.strToken = [...strToken]
    this.strToken.push(this.end)
    this.started = false
  }

  getInitContext() {
    return {
      cur_index: 0,
      // stack: new ParsingStack().push(this.grammar.getSign('$','Terminal')).push(this.grammar.getStartSign())
      stack: new ParsingStack().push(this.end).push([this.grammar.getStartSign()])
    }
  }

  * epoch(curContext) {
    const { cur_index, stack } = curContext

    // const G = this.grammar
    const empty = this.empty
    const end = this.end
    const PPT = this.PredictiveParsingTable
    const strToken = this.strToken
    let X = stack.peek()
    const p = strToken[cur_index]
    let M = PPT.get(X, p)

    // console.log(strToken)
    // 返回初始值
    if (!this.started) {
      let realStack=stack.getStack()
      let stackStr=''
      for(let i=0;i<realStack.length;i++){
        stackStr+=realStack[i].getString()
      }
      yield {
        p:p.getString(),
        M:M===null?M:M.getString(),
        Production: '',
        method:"",
        token:this.getTokenStringLast(cur_index),
        stack:stackStr
      }
      this.started = true
    }

    while (X !== p ) {
      if (X.isTerminal()) {
        console.log('栈顶：', X.getString(), '\t字符：', p.getString())
        return this.error()
      }
      else if (!M) {
        console.log('栈顶：', X.getString(), '\t字符：', p.getString())
        console.log('M is null:', M)
        return this.error()
      }
      else if (M.getBody().length === 1 && M.getBody()[0] === empty) {
        stack.pop()
        let realStack=stack.getStack()
        let stackStr=''
        for(let i=0;i<realStack.length;i++){
          stackStr+=realStack[i].getString()
        }
        yield {
          p:p.getString(),
          M:M===null?M:M.getString(),
          Production: this.getTokenString(cur_index),
          method:"generate",
          token: this.getTokenStringLast(cur_index),
          stack:stackStr
        }
      } else {
        stack.pop()
        stack.push(M.getBody())
        let realStack=stack.getStack()
        let stackStr=''
        for(let i=0;i<realStack.length;i++){
          stackStr+=realStack[i].getString()
        }
        yield {
          p:p.getString(),
          M:M===null?M:M.getString(),
          Production: this.getTokenString(cur_index),
          method: "generate",
          token: this.getTokenStringLast(cur_index),
          stack:stackStr
        }
      }
      X = stack.peek()
      M = PPT.get(X, p)
    }

    if (X === end) {
      return [true, true]
    }

    stack.pop() // 匹配非终结符号
    let realStack=stack.getStack()
    let stackStr=''
    for(let i=0;i<realStack.length;i++){
      stackStr+=realStack[i].getString()
    }
    yield {
      p:p.getString(),
      M:M===null?M:M.getString(),
      Production: this.getTokenString(cur_index+1),
      method: "match",
      token: this.getTokenStringLast(cur_index+1),
      stack:stackStr
    }

    const nextContext = {
      cur_index: cur_index + 1,
      stack
    }
    return [false, nextContext]
  }

  runEpoch(curContext) {
    const run = this.epoch(curContext)
    let ret = null
    do {
      ret = run.next()
    } while (ret.done === false)
    return ret.value
  }

  run() {
    let ret = [false, this.getInitContext()]

    while (ret[0] === false) {
      ret = this.runEpoch(ret[1])
    }
    return ret[1]
  }

  error() {
    console.log('发生错误')
    // 第二个参数表示失败
    return [true, false]
  }
  getCurResult({ stack, cur_index }) {
    return {
      'stack': stack,
      'strToken': this.strToken.slice(cur_index)
    }
  }
  getTokenString(n){
    let result=""
    for(let i=0;i<n;i++){
      result+=this.strToken[i].getString()
    }
    return result
  }
  getTokenStringLast(n){
    let result=""
    for(let i=n;i<this.strToken.length;i++){
      result+=this.strToken[i].getString()
    }
    return result
  }
}

module.exports= GenerateParsingStack
