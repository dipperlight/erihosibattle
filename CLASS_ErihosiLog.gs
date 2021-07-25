/**
 * 基本的な使い方は　できるだけグローバルな部分でインスタンスを生成
 *    const erihosiLog = new ErihosiLog()
 * 
 * ログ出したいところの手前でグループ名をセット
 *    erihosiLog.set_group('好きな区分名')
 * 
 * ログを出したい箇所でそれぞれで記録
 *    erihosiLog.set_group('イベント名', '内容')
 * 
 * 最後にほしいログを取得
 *    erihosiLog.result('好きな区分名')
 * 
 * ややこしく色々書いてるのは主にデバッグで使えそうな機能
 * システムログとゲーム上のログを同一にあつかうクソ仕様ﾃﾞｽ
 */

class ErihosiLog {
  constructor() {
    this.logging = true
    this.logs = []
    this.prev_group = 'common'
    this.prev_level = '5'
  }

  /**
   * ログを記録する、類似の箇所で連続で利用する場合はこっち
   * groupを省略した場合、前回指定したグループに記録する
   * add(イベント名,内容,グループ名(省略時は前回のグループに追加),ログレベル(省略時前回のレベル)) 
   */
  add(event, text, group=this.prev_group, level =this.prev_level) {
    if (this.logging || leve<0) {
      this.logs.push({
        event: event,
        text: text,
        level: level,
        group: group
      })
    }
    this.prev_group = group
    this.prev_level = level
  }

  /**
   * ログを記録する、連続していない単発のログはこっち
   * log(イベント名,内容,グループ名(省略不可),ログレベル(省略時1)) 
   * このメソッドを呼んでもaddで利用される連続グループに影響しない
   */
  log(event, text, group, level = 1){
    if (this.logging || level<0) {
      this.logs.push({
        event: event,
        text: text,
        level: level,
        group: group
      })
    }
  }

  // 必要はないが命令記述で書きたい場合のために用意
  // erihosiLog.group = 'ぐるーぷ'　と同等
  // addを使い始める前に記述してほしい
  set_group(group){
    this.prev_group = group
  }
  set_level(level){
    this.prev_level = level
  }

  // 何らかの都合でログの一時停止をしたい場合に利用
  // ただし0未満レベルのログは停止中でも記録される
  stop_logging(){
    this.logging = false
  }
  start_logging(){
    this.logging = true
  }

  /**
   * 指定したログレベル以上のログを消去する 省略で0以上を消去
   */
  // 指定したグループ、かつ、ログレベル以上のログを消去する 省略で0以上を消去
  clear(group='',level=0){
    this.logs = this.logs.filter(log => {
      return !((!group||group==log.group) && log.level >= level)
    })
  }

  /**
   * 指定したグループ、かつ、ログレベル以下のログを出力する　グループを省略した場合全グループ、ログレベルを省略した場合1以下を出力する
   */
  result(group='',level = 1) {
    //Logger.log(JSON.stringify(this.logs))
    let output = this.logs.filter(log => {
      return (!group||group==log.group) && log.level <= level
    })
    output = output.filter(log => log.level <= level)
    return output.map(log => log.text).join("\n")
  }
}

var ERIHOSHI_LOG = new ErihosiLog()
const [FATAL,WARN,INFO,VERBOSE,DEBUG] = [-1,0,1,2,5]
