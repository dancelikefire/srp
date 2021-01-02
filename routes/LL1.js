let express = require('express');
let router = express.Router();
let Sign = require('../lib/tool/sign')//class
let SymbolTable=require('../lib/LL1/symbolTable')//class
let Grammar = require('../lib/tool/grammar')//class
let generateGrammar = require('../lib/LL1/generate-grammar-from-user-input')//function
let ELF = require('../lib/LL1/extract-left-factor')//class
let ELR = require('../lib/LL1/eliminate-left-recursion')//function
let FirstSet = require('../lib/LL1/generate-first-set')//class
let FollowSet = require('../lib/LL1/generate-follow-set')//class
let isLL1 = require('../lib/LL1/is-LL1')//function
let generatePredictiveParsingTable = require('../lib/LL1/generate-predictive-parsing-table')//class
let generateParsingStack = require('../lib/LL1/generate-parsing-stack')//class

router.post('/run', (req, res, next) => {
    // req.body.production
    // [[],
    //  []]
    // let nonTer=[]
    // for(const item of req.body.productions)nonTer.push(item[0])

    let productions = []
    for (const item of req.body.productions) {
        let production = []

        // let index=-1
        // for(let i=0;i<nonTer.length;i++){
        //   if(nonTer[i]===item[0]){
        //     index=i
        //     break
        //   }
        // }
        // if(index!==-1) {
        //   let head = new Sign(item[0], 'Nonterminal')
        // }else{
        //   let head =
        // }
        let head = new Sign(item[0], 'Nonterminal')
        let body = []
        for (let i = 1; i < item.length; i++) {
            body.push(new Sign(item[i], 'Terminal'))
        }
        production.push(head)
        production.push(body)
        productions.push(production)
    }
    console.log(productions)
    //生成文法
    //添加产生式和开始符号
    // [[{},[]],
    //  [{},[]]]
    // sign对象
    let grammar = generateGrammar(productions);

    let firstSet = new FirstSet(grammar)
    let result = firstSet.run()
    grammar.setFirstSet(result)

    let followSet = new FollowSet(grammar)
    result = followSet.run()
    grammar.setFollowSet(result)

    result = isLL1(grammar)

    let parsingTable = new generatePredictiveParsingTable(grammar)
    result = parsingTable.run()
    grammar.setPPT(result)

    let signs = [];
    for (const cha of req.body.str) {
        signs.push(grammar.getSign(cha))
    }
    let parsingStack = new generateParsingStack(grammar, grammar.getPPT(), signs)
    result = parsingStack.run()
    res.json(result)
})

router.post('/tokens',(req,res,next)=>{
    req.session.tokens=req.body.tokens
    res.json({})
})
router.post('/productions', (req, res, next) => {
    // req.body.production
    // [[],
    //  []]
    req.session.productions=req.body.productions
    let symbolTable=new SymbolTable(req.session.tokens)
    let productions = []
    for (const item of req.body.productions) {
        let production = []
        let head = symbolTable.getSign(item[0])
        let body = []
        for (let i = 1; i < item.length; i++) {
            body.push(symbolTable.getSign(item[i]))
        }
        production.push(head)
        production.push(body)
        productions.push(production)
    }
    // 生成文法
    // 添加产生式和开始符号
    // [[{},[]],
    //  [{},[]]]
    // sign对象
    let grammar = generateGrammar(productions);
    res.json({})
})

router.get('/leftFactor',(req,res,next)=>{
    let symbolTable=new SymbolTable(req.session.tokens)
    let productions = []
    for (const item of req.session.productions) {
        let production = []
        let head = symbolTable.getSign(item[0])
        let body = []
        for (let i = 1; i < item.length; i++) {
            body.push(symbolTable.getSign(item[i]))
        }
        production.push(head)
        production.push(body)
        productions.push(production)
    }
    let grammar = generateGrammar(productions);
    let elf=new ELF(grammar)
    // let result=[]
    //
    // let ret = [false, elf.getInitContext()]
    // while (ret[0] === false) {
    //     ret = elf.runEpoch(ret[1])
    //     result.push(elf.getCurResult(ret[1]))
    // }
    let newGrammar=elf.run().newGrammar
    let newProductions=newGrammar.productions
    let newSigns=newGrammar.signs

    let result={
        "newProduction":[],
        "newSigns":{
            "Terminals":newGrammar.getTerminals().map(e=>e.symbol),
            "Nonterminals":newGrammar.getNonterminals().map(e=>e.symbol)
        }
    }
    for(const production of newGrammar.getProductions()){
        let head=production.getHead().symbol
        let body=production.getBody().map(e=>e.symbol)
        let temp={}
        temp[head]=body
        result.newProduction.push(temp)
    }
    console.log(result)
    res.json(result)
})

router.get('/leftRecursion',(req,res,next)=>{
    let symbolTable=new SymbolTable(req.session.tokens)
    let productions = []
    for (const item of req.session.productions) {
        let production = []
        let head = symbolTable.getSign(item[0])
        let body = []
        for (let i = 1; i < item.length; i++) {
            body.push(symbolTable.getSign(item[i]))
        }
        production.push(head)
        production.push(body)
        productions.push(production)
    }
    let grammar = generateGrammar(productions);
    let elf=new ELF(grammar)
    let result=elf.run()
    grammar=result.newGrammar

    result=ELR(grammar)
    delete result.eliminatingEmptyGrammar
    delete result.eliminatingCyclesGrammar

    res.json(result)
})

router.get('/firstset', (req, res, next) =>{
    let symbolTable=new SymbolTable(req.session.tokens)
    let productions = []
    for (const item of req.session.productions) {
        let production = []
        let head = symbolTable.getSign(item[0])
        let body = []
        for (let i = 1; i < item.length; i++) {
            body.push(symbolTable.getSign(item[i]))
        }
        production.push(head)
        production.push(body)
        productions.push(production)
    }

    let grammar = generateGrammar(productions)
    let elf= new ELF(grammar)
    let result=elf.run()
    grammar=result.newGrammar

    result=ELR(grammar)
    grammar=result.eliminateLeftRecursionGrammar

    result=[]
    let firstSet = new FirstSet(grammar)
    let ret = [false, firstSet.getInitContext()]
    // let temp=[]
    while (ret[0] === false) {
        ret = firstSet.runEpoch(ret[1])
        if(ret[0]===false) {
            result.push(firstSet.getCurResult(ret[1]).asDic())
            // temp.push(ret[1])
        }
    }
    // temp=temp.slice(0,temp.length-firstSet.allFirstSet.length)
    result=result.slice(0,result.length-firstSet.allFirstSet.length)

    res.json(result)
})

router.get('/followset', (req, res, next) => {
    let symbolTable=new SymbolTable(req.session.tokens)
    let productions = []
    for (const item of req.session.productions) {
        let production = []
        let head = symbolTable.getSign(item[0])
        let body = []
        for (let i = 1; i < item.length; i++) {
            body.push(symbolTable.getSign(item[i]))
        }
        production.push(head)
        production.push(body)
        productions.push(production)
    }
    let grammar = generateGrammar(productions)
    let elf= new ELF(grammar)
    let result=elf.run()
    grammar=result.newGrammar

    result=ELR(grammar)
    grammar=result.eliminateLeftRecursionGrammar

    let firstSet = new FirstSet(grammar)
    result = firstSet.run()
    grammar.setFirstSet(result)


    let followSet = new FollowSet(grammar)
    result = []
    let ret = [false, followSet.getInitContext()]
    while (ret[0] === false) {
        ret = followSet.runEpoch(ret[1])
        result.push(ret[1]['followset'].asDic())
    }
    result=result.slice(0,result.length-1)
    console.log(result)
    res.json(result)
})
router.get('/isLL1', (req, res, next) => {
    let symbolTable=new SymbolTable(req.session.tokens)
    let productions = []
    for (const item of req.session.productions) {
        let production = []
        let head = symbolTable.getSign(item[0])
        let body = []
        for (let i = 1; i < item.length; i++) {
            body.push(symbolTable.getSign(item[i]))
        }
        production.push(head)
        production.push(body)
        productions.push(production)
    }
    let grammar = generateGrammar(productions);
    let elf= new ELF(grammar)
    let result=elf.run()
    grammar=result.newGrammar

    result=ELR(grammar)
    grammar=result.eliminateLeftRecursionGrammar

    let firstSet = new FirstSet(grammar)
    result = firstSet.run()
    grammar.setFirstSet(result)
    let followSet = new FollowSet(grammar)
    result = followSet.run()
    grammar.setFollowSet(result)


    result = isLL1(grammar)
    res.json(result)
})

router.get('/parsingTable', (req, res, next) => {
    let symbolTable=new SymbolTable(req.session.tokens)
    let productions = []
    for (const item of req.session.productions) {
        let production = []
        let head = symbolTable.getSign(item[0])
        let body = []
        for (let i = 1; i < item.length; i++) {
            body.push(symbolTable.getSign(item[i]))
        }
        production.push(head)
        production.push(body)
        productions.push(production)
    }
    let grammar = generateGrammar(productions);
    let elf= new ELF(grammar)
    let result=elf.run()
    grammar=result.newGrammar

    result=ELR(grammar)
    grammar=result.eliminateLeftRecursionGrammar

    let firstSet = new FirstSet(grammar)
    result = firstSet.run()
    grammar.setFirstSet(result)
    let followSet = new FollowSet(grammar)
    result = followSet.run()
    grammar.setFollowSet(result)



    let parsingTable = new generatePredictiveParsingTable(grammar)
    result = []
    let ret = [false, parsingTable.getInitContext()]
    while (ret[0] === false) {
        ret = parsingTable.runEpoch(ret[1])
        if(ret[0]===false) {
            // result.push(ret[1].table.getTableData())
            result.push(ret[1].table.getTableData())
        }
    }

    let stringfyResult=[]
    for(let e of result){
        let temp={"nonterminals":[],
            "terminals":[],
            "table":[]}
        for(let k of e.nonterminals){
            temp.nonterminals.push(k.getString())
        }
        for(let k of e.terminals) {
            temp.terminals.push(k.getString())
        }
        for(let k of e.table){
            let row=[]
            for(let j of k){
                if(j !==null){
                    row.push(j.getString())
                }else{
                    row.push(null)
                }
            }
            temp.table.push(row)
        }
        stringfyResult.push(temp)
    }
    res.json(stringfyResult)
})


router.post('/parse', (req, res, next) => {
    let symbolTable=new SymbolTable(req.session.tokens)
    let productions = []
    for (const item of req.session.productions) {
        let production = []
        let head = symbolTable.getSign(item[0])
        let body = []
        for (let i = 1; i < item.length; i++) {
            body.push(symbolTable.getSign(item[i]))
        }
        production.push(head)
        production.push(body)
        productions.push(production)
    }
    let grammar = generateGrammar(productions)
    let elf= new ELF(grammar)
    let result=elf.run()
    grammar=result.newGrammar

    result=ELR(grammar)
    grammar=result.eliminateLeftRecursionGrammar

    let firstSet = new FirstSet(grammar)
    result = firstSet.run()
    grammar.setFirstSet(result)
    let followSet = new FollowSet(grammar)
    result = followSet.run()
    grammar.setFollowSet(result)
    let parsingTable = new generatePredictiveParsingTable(grammar)
    result = parsingTable.run()
    grammar.setPPT(result)

    let signs = [];
    for (const cha of req.body.str) {
        signs.push(grammar.getSign(cha))
    }

    let parsingStack = new generateParsingStack(grammar, grammar.getPPT(), signs)
    result = []
    let ret = [false, parsingStack.getInitContext()]
    while (ret[0] === false) {
        // parsingStack.epoch()
        // ret = parsingStack.runEpoch(ret[1])
        // if(ret[0]===false) {
        //     result.push(ret[1].stack)
        // }
        const run = parsingStack.epoch(ret[1])
        let yield = null
        do {
            yield = run.next()
            if(!yield.done) {
                result.push(yield.value)
            }
        } while (yield.done === false)
        ret=yield.value
    }

    // console.log(result)
    res.json(result)
})
module.exports = router;
