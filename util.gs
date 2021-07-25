// 数値、または、数値として扱える数字ならtrue、それ以外はfalse
var isNumber = (x) => {
  if (typeof (x) != 'number' && typeof (x) != 'string') {
    return false;
  } else {
    return (x == parseFloat(x) && isFinite(x));
  }
}

// 2つの値(a,b)が同じなら「b」、違えば「a~b」と返す
var ranged_text = (min, max, len) => {
  return min == max ? max : min + "~" + max.format(' ',len)
}

var pop_max = (ranged_text) => {
  return +String(ranged_text).match(/(\d+)$/)?.[0]??0
}


// インスタンスのクローンを提供する基底クラス
// http://var.blog.jp/archives/78945827.html
class Clonable {
  clone() {
    const clone = Object.create(this)
    for (const prop of this.constructor.clone_properties) {
      clone[prop] = this[prop].clone?.()??Object.create(this[prop])
    }
    return clone
  }

  static get clone_properties() {
    return []
  }
}


// 数値クラスを拡張して指定長の文字列で返す機能
Number.prototype.format = function(char, cnt){
  return (Array(cnt).fill(char).join("") + this.valueOf()).substr(-1*cnt); 
}


const ELEMENTS = ['火', '水', '風', '地', '甘', '苦', '塩', '酸', '辛', '毒']