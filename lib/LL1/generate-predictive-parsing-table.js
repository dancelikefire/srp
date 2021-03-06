let PredictiveParsingTable =require('../tool/predictive-parsing-table')
class GeneratePredictiveParsingTable {
  constructor(grammar) {
    this.grammar = grammar
  }
  // 获取初始化context
  getInitContext() {
    return {
      cur_g_index: 0,
      table: new PredictiveParsingTable()
    }
  }
  // epoch函数为generator，执行算法的每一轮循环，返回一个数组[isFinish, nextContext]。该函数接受curContext作为本轮算法的上下文，并在nextContext中返回经过该次算法迭代后的算法上下文
  // 由于每个算法循环中都包含几个步骤，考虑到前端的展示需求，在需要前端展示变化的时候，通过yield返回视图上所需的变化
  * epoch(curContext) {
    const { cur_g_index, table } = curContext
    const G = this.grammar
    if (cur_g_index >= G.productions.length) {
      return [true, table]
    }
    const curProduction = G.productions[cur_g_index]

    const curFirstSet = new Set(G.getProductionBodyFirstSet(curProduction))
    const curFollowSet = new Set(G.getSignFollowSet(curProduction.head))
    const Empty = G.getEmptySign()
    const End = G.getStackBottomSign()
    // yield {
    //   curProduction,
    //   notice: '分析产生式`' + curProduction.getString() + '`',
    //   step: 0,
    //   highlightSymbols: []
    // }
    for (const symbol of curFirstSet) {
      if(symbol.isTerminal() == false){
        continue;
      }
      table.set(curProduction.head, symbol, curProduction)
      yield {
        curProduction,
        notice: '分析产生式`' + curProduction.getString() + '` ' + `\`First(${curProduction.getBodyString()})\`中存在终止符 \`${symbol.getString()}\` , 将产生式 \`${curProduction.getString()}\` 加入到分析表\`M[${curProduction.getHeadString()}, ${symbol.getString()}]\`中`,
        step: 0,
        highlightSymbols: [symbol]
      }
    }
    if (curFirstSet.has(Empty)) {
      yield {
        curProduction,
        notice: `\`First(${curProduction.getBodyString()})\`中存在\`${Empty.getString()}\``,
        step: 1,
        highlightSymbols: [Empty]
      }
      for (const symbol of curFollowSet) {
        if(symbol.isTerminal() == false){
          continue;
        }
        table.set(curProduction.head, symbol, curProduction)
        yield {
          curProduction,
          notice: `\`Follow(${curProduction.getHeadString()})\`中存在终止符 \`${symbol.getString()}\` , 将产生式 \`${curProduction.getString()}\` 加入到分析表\`M[${curProduction.getHeadString()}, ${symbol.getString()}]\`中`,
          step: 1,
          highlightSymbols: [symbol]
        }
      }
      if (curFollowSet.has(End)) {

        table.set(curProduction.head, End, curProduction)
        yield {
          curProduction,
          notice: `\`Follow(${curProduction.getHeadString()})\`中存在 \`$\` , 将产生式 \`${curProduction.getString()}\` 加入到分析表\`M[${curProduction.getHeadString()}, $]\`中`,
          step: 2,
          highlightSymbols: [End]
        }
      } else {
        yield {
          curProduction,
          notice: `\`Follow(${curProduction.getHeadString()})\`中不存在 \`$\` ，跳过`,
          step: 2,
          highlightSymbols: []
        }
      }
    } else {
      yield {
        curProduction,
        notice: `\`First(${curProduction.getBodyString()})\`中不存在 \`${Empty.getString()}\` ，跳过`,
        step: 1,
        highlightSymbols: []
      }
    }
    const nextContext = {
      cur_g_index: cur_g_index + 1,
      table
    }
    return [false, nextContext]
  }
  getCurResult({ table }) {
    return table.getTableData()
  }
  getModifyPosition({table}){
    return table.getModifyPosition()
  }
  getResultFromContext({ table }) {
    return table
  }
  // 包装器，用于完整运行每一个epoch，返回[isFinish, nextContext]
  runEpoch(curContext) {
    const run = this.epoch(curContext)
    let ret = null
    do {
      ret = run.next()
    } while (ret.done === false)
    return ret.value
  }
  // 执行整个算法，返回该算法的输出
  run() {
    let ret = [false, this.getInitContext()]
    while (ret[0] === false) {
      ret = this.runEpoch(ret[1])
    }
    return ret[1]
  }
}
module.exports =GeneratePredictiveParsingTable
