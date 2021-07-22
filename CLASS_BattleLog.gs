class BattleLog{
  constructor(){
    this.texts= []
    this.events=[]
  }

  /* TODO */  

  // わかりやすい関数名をつける、引数は好きに付けてｏｋ
  // 最後に_addメソッドを呼び出す(呼ばないと記録されない)
  text(text){
    this._add('text',text,[...arguments])
  }

  atk_up(before,value,prefix='',suffix=''){
    const text = `${prefix}攻撃力が${value}上昇！（攻撃${before+value}）${suffix}`

    this._add('atk_up',text,[...arguments])
  }
  
  atk_down(before,value,prefix='',suffix=''){
    const text = `${prefix}攻撃力が${value}減少！（攻撃${before+value}）${suffix}`

    this._add('atk_down',text,[...arguments])
  }

  result(){
    return this.texts.join("\n")
  }

  /**
   * caller 呼び出し元メソッド名、またはイベント名
   * text   ログの本文
   * args   呼び出し元メソッドの引数
   * */
  _add(caller,text,args){
    this.texts.push( text )
    this.events.push({
      event:caller,
      args:args
    })
  }
}