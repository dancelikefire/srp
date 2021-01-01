let Sign=require('../tool/sign')

class SymbolTable{
    // [
    //  ["token","type"]
    //  ]
    constructor(tokens) {
        this.tokens=this.wrapper(tokens)
        return this
    }
    wrapper(tokens){
        let map=new Map()
        for(let token of tokens){
            map.set(token[0],new Sign(token[0],token[1]))
        }
        return map
    }
    getSign(token){
        if(this.tokens.has(token))
            return this.tokens.get(token)
        else
            return null
    }
}

module.exports=SymbolTable