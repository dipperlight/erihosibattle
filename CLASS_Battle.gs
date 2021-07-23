
var debug = () => {
  const dummy_battleCharactor = new BattleCharactor(new Item('〈風刃：サバンナ〉武具(7)/38/13/12/風/【木天蓼】作。武具：弓矢系。'), new Item('〈魔動式カラクリ鳳仙花〉防具(7)/20/13/12/辛/【木天蓼】作。防具：護符系。'), '魚人', '武闘家', '技巧', 3)
  const dummy_enemy = new Enemy('ダミー', '草原', 2, 10, 10, 10, 10, 10, 10, '器物', 10, false, 0, '風', '地', 2)
  const dummy_command = new Command('全力攻撃', '専守防衛', '魔法攻撃', '通常防御', '全力防御', '逃走')
  const dummy_area = '草原'

  dummy_battle = new Battle(dummy_battleCharactor, dummy_enemy, dummy_command, dummy_area)

  let ret = dummy_battle.run(1000)
  return
}

class Battle {
  constructor(battle_charactor, enemy, command, area) {
    this.character = battle_charactor.clone()
    this.enemy = enemy.clone()
    this.command = command
    this.area = area
  }

  exec(detail = false) {
    let turn = 1
    let text = ''
    let eob = true // 戦闘終了フラグ falseで戦闘終了
    let result = 0 // 1:勝利 0:引き分け -1:敗北
    const log = new BattleLog()
    const c = this.character.clone()
    const e = this.enemy.clone()
    const hp_before = c.hp
    const mp_before = c.mp

    //ログテスト
    log.text('test,戦闘開始')

    // 戦闘開始前処理 ***********************
    // 魔力耐性
    c.matk.max -= (e.rank * 5 + e.magic_resist)
    c.mdef.max -= (e.rank * 5 + e.magic_resist)

    // 魔力反応処理
    if (e.magic_reaction) {
      /* TODO */
    }

    // 特殊地形(聖域・原始林)処理
    switch (this.area) {
      case '聖域':
      /* FALLTHROUGH */
      case '原始林':
        c.matk.dice = Math.float(c.matk.dice / 4)
        c.mdef.dice = Math.float(c.mdef.dice / 4)
        break;
    }

    // 種族特効
    switch (e.race) {
      case '死霊':
        c.atk += c.ghost_effect
        c.def += c.ghost_effect
        break;
      case '器物':
        c.atk += c.box_effect
        c.spd += c.box_spd
        break;
    }

    do {
      // ターン開始時処理 **********************
      const tc = c.clone()  //ターン中にステが変化するためクローン

      //辛セット効果　マイナスにまでなるかは知らない　とりあえず下限設定はなし　/* UNCERTAIN */
      e.atk -= tc.curse
      e.def -= tc.curse

      const te = e.clone()　//ターン中にステが変化するためクローン

      //苦セット効果　全力のHP消費の前に判定されるか否かが結果に影響する　多分前だと考え、この位置に /* UNCERTAIN */
      tc.hp += tc.regen

      //　コマンドによるステ変化
      const offensive_command = this.command.offense(turn)
      const defensive_command = this.command.defense(turn)
      tc.command(offensive_command, defensive_command)

      //行動順判定 PC先手：true PC後手：false
      let character_move = tc.spd >= te.spd // 同値はPC有利のためPC先手

      // 戦闘処理
      for (let i = 0; i < 2; i++) {  //先手が0で後手が1　2になったら処理終わり
        // 行動前処理　必要？

        if (character_move) {
          // 自分の攻撃
          if (!['専守防衛'].includes(offensive_command) && eob) { // 専守防衛のときはまるごと飛ばす
            //弱点
            if (tc.weapon.element == te.week_element) {
              const week_effect = Battle.battle_dice(tc.weapon.rank)
              tc.atk += week_effect
            }

            //魔法攻撃詠唱 後手で魔力減少攻撃を受けてMPが0以下になった場合不発　/* UNCERTAIN */
            if (offensive_command == '魔法攻撃' && tc.mp >= 1) {
              if (tc.mp >= 1) {
                const matk_effect = Math.min(Battle.battle_dice(tc.matk.dice), tc.matk.Math.max)
                tc.atk += matk_effect
                if (['杖'].includes(tc.weapon.type)) {
                  tc.atk += tc.weapon.magic_value
                }
                tc.mp--
                if (tc.matk.free) {
                  tc.mp++
                }
              }
            }
            // 必中判定
            const avo_dice = te.avo - tc.hit

            // 敵の回避
            if (avo_dice > 0) {
              const avo_effect = Battle.battle_dice(avo_dice)
              te.def += avo_effect
            }

            //重武器による防御貫通
            // 敵の回避による防御上昇の後に判定されるのか否か？　ここでは上がった防御ごと削れると扱う
            //ここはよくわからん、最悪、辛セットの前に発動してる可能性もある /* UNCERTAIN */
            if (tc.weapon.weight == '重') {
              const penetrate_effect = Math.floor(te.def * (20 - te.rank) / 100)
              te.def -= penetrate_effect
            }

            // ダメージ算出
            let damage = tc.atk - te.def
            if (avo_dice <= 0) {
              const crit_effect = Math.floor(damage * tc.crit_multi)
              damage += crit_effect
            }

            // ダメージ処理
            if (damage > 0) {
              te.hp -= damage
            }

            // 死亡判定
            if (te.hp < 0) {  // 敵死亡 勝利
              result = 1
              eob = false
            }
          }
          character_move = !character_move

        } else {
          if (eob) {
            // 敵の攻撃
            // 特殊攻撃
            if (te.special_atk_dice > 0) {
              const act_special_dice = Math.max(0, te.special_dice - tc.special_reduce - (te.special_element == tc.armor.element ? tc.armor.rank : 0))
              if (act_special_dice > 0) {
                const special_effect = Battle.battle_dice(act_special_dice)
                te.atk += special_effect
              }
            }

            // PCの魔法防御詠唱
            if (defensive_command == '魔法防御' && tc.mp >= 1) {
              const mdef_effect = Math.min(Battle.battle_dice(tc.mdef.dice), tc.mdef.Math.max)
              tc.def += mdef_effect
              tc_mp--
              if (tc.mdef.free) {
                tc.mp++
              }
            }

            // 必中判定
            const avo_dice = tc.avo - te.hit

            // PCの回避
            if (avo_dice > 0) {
              const avo_effect = Battle.battle_dice(avo_dice)
              tc.def += avo_effect
            }

            // ダメージ算出
            let damage = Math.max(te.atk - tc.def, 0)
            if (avo_dice < 0) {
              const crit_effect = Math.floor(damage * tc.crit_taken)
              damage += crit_effect
            }

            // ダメージ処理
            if (damage > 0) {
              tc.hp -= damage
              if (te.magic_reduce > 0) { // 魔力減少
                tc.mp -= te.magic_reduce
              }
            }

            // 死亡判定
            if (tc.hp < 0) {  // PC死亡 敗北
              result = -1
              eob = false
            }
          }
          character_move = !character_move
        }
      }
      // ターン終了時処理
      // 逃走
      if (defensive_command == '逃走') {  // PC逃走 敗北
        result = -1
        eob = false
      }
      // HP・MPをオリジナルに反映
      c.hp = tc.hp
      c.mp = tc.mp
      e.hp = te.hp
      turn++
    } while (eob && turn <= 3)

    return {
      result: result, // 勝利：1　引き分け：0　敗北　-1
      detail: log.result(), /* TODO */
      hp_used: hp_before - Math.min(c.hp, c.maxhp), // 戦闘中は最大値をこえて回復するが、終了時に最大値まで戻る
      mp_used: mp_before - Math.min(c.mp, c.maxhp)  // MPが増えることはなさそうだが一応
    }
  }

  run(times = 100) {
    const loop = times > 10000 ? 10000 : times // 念の為最大回数制限
    const stat = {
      try: loop,
      win: 0,
      draw: 0,
      lose: 0,
      texts: [],
      hp_used: {},
      mp_used: {}
    }
    for (let i = 0; i < loop; i++) {
      const r = this.exec()
      if (r?.result === 1) {
        stat.win++
      }
      else if (r?.result === 0) {
        stat.draw++
      }
      else if (r?.result === -1) {
        stat.lose++
      } else { throw { message: 'なんか変な結果返ってるよ' } }
      if (r?.detail) stat.texts.push(r.detail)

      if (stat.hp_used[r.hp_used] == null) { stat.hp_used[r.hp_used] = 0 }//初回は作る
      stat.hp_used[r.hp_used]++

      if (stat.mp_used[r.mp_used] == null) { stat.mp_used[r.mp_used] = 0 }//初回は作る
      stat.mp_used[r.mp_used]++
    }
    return stat;
  }

  // ***************************************************************************
  static battle_dice(n) {
    let sum = 0;
    for (let i = 0; i < n; i++) {
      const deme = Math.floor(Math.random() * 11)
      sum += deme == 10 ? 15 : (deme == 1 ? -3 : deme)
    }
    return sum < 0 ? 0 : sum
  }
}


class Command {
  constructor(off1, off2, off3, def1, def2, def3) {
    this.offense1 = off1
    this.offense2 = off2
    this.offense3 = off3
    this.defense1 = def1
    this.defense2 = def2
    this.defense3 = def3
  }

  offense(turn = null) {
    if (turn === null) { return [offense1, offense2, offense3] }
    if ([1, 2, 3].includes(turn)) {
      return eval(`this.offense${turn}`)
    } else {
      throw { message: 'そんなターンはないよ' }
    }
  }
  defense(turn = null) {
    if (turn === null) { return [defense1, defense2, defense3] }
    if ([1, 2, 3].includes(turn)) {
      return eval(`this.defense${turn}`)
    } else {
      throw { message: 'そんなターンはないよ' }
    }
  }
  turn(turn) {
    if ([1, 2, 3].includes(turn)) {
      return eval(`[this.offense${turn},this.defense${turn}]`)
    } else {
      throw { message: 'そんなターンはないよ' }
    }
  }

  static get ATTACK_COMMAND() { return ['通常攻撃', '全力攻撃', '正確攻撃', '魔法攻撃', '専守防衛'] }
  static get DEFENCE_COMMAND() { return ['通常防御', '全力防御', '回避体勢', '魔法防御', '逃走'] }
}

