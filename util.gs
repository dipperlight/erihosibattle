// 数値、または、数値として扱える数字ならtrue、それ以外はfalse
function isNumber(x) {
  if (typeof (x) != 'number' && typeof (x) != 'string') {
    return false;
  } else {
    return (x == parseFloat(x) && isFinite(x));
  }
}

// 2つの値(a,b)が同じなら「b」、違えば「a~b」と返す
function range(min, max) {
  return min == max ? max : min + "~" + max
}

// インスタンスのクローンを提供する基底クラス
// http://var.blog.jp/archives/78945827.html
class Clonable {
  clone() {
    const clone = Object.create(this)
    for (const prop of this.constructor.clone_properties) {
      clone[prop] = this[prop].clone()
    }
    return clone
  }

  static get clone_properties() {
    return []
  }
}


const ELEMENTS = ['火', '水', '風', '地', '甘', '苦', '塩', '酸', '辛', '毒']