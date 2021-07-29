class Dice {
  constructor(){
    this.dice = []
  }

  sum() {
    return this.dice.reduce((a, x) => a + x);
  }
  
  roll(n){
    this.dice = []
    for (let i = 0; i < n; i++) {
      this.dice.push(Math.floor(Math.random() * 10)+1) // 1-10の乱数
    }
  }
  
  simple_text(){
    let ten_dice_text = []
    let idx = 0
    while(idx<=this.dice.length){
      ten_dice_text.push(this.dice.slice(idx,idx+10).join('/'))
      idx+=10
    }
    return ten_dice_text.join("\n")
  }

  text(){
    return this.simple_text().replace(/10/g, '★').replace(/[1-9]/g, function(s) {
        return s=='1' ? '①' : String.fromCharCode(s.charCodeAt(0) + 0xFEE0);
    })
  }
}

class BattleDice extends Dice {
  sum() {
    let sum = 0;
    for (const deme of this.dice) {
      sum += deme == 10 ? 15 : (deme == 1 ? -3 : deme)
    }
    return sum < 0 ? 0 : sum
  }
}