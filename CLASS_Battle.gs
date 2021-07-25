class Battle {
  constructor(battle_charactor, enemy, command, sanctuary, underwater) {
    this.character = battle_charactor.clone()
    this.enemy = enemy.clone()
    this.command = command
    this.sanctuary = sanctuary
    this.underwater = underwater
  }

  exec(detail = false) {
    let turn = 1
    let eob = true // 戦闘終了フラグ falseで戦闘終了
    let result = 0 // 1:勝利 0:引き分け -1:敗北
    const log = ERIHOSHI_LOG
    log.clear('battle')    // 既存の　battle　グループをクリア
    log.set_group('battle') // ロググループを　battle に設定
    log.set_level(detail?INFO:VERBOSE) // ログレベルを設定　detail? true:1 false:2
    const c = this.character.clone()
    const e = this.enemy.clone()
    const hp_before = c.hp
    const mp_before = c.mp

    //戦闘開始
log.add('戦闘開始時','戦闘開始')

    // 戦闘開始前処理 ***********************
    // 魔法最大値
    //敵ランク分
      c.matk.max -= e.rank * 5
      c.mdef.max -= e.rank * 5

    // 魔力耐性
log.log('魔力耐性',`魔力耐性：${e.magic_resist}`,'battle',DEBUG)
    if (e.magic_resist) {
      c.matk.max -= e.magic_resist
      c.mdef.max -= e.magic_resist
    }
    // 0未満にはならない
    c.matk.max = c.matk.max<0? 0: c.matk.max
    c.mdef.max = c.mdef.max<0? 0: c.mdef.max
log.add('魔力最大値',`魔攻最大値:${c.matk.max} , 魔防最大値:${c.mdef.max} `)

    // 魔力反応処理
log.log('魔力耐性',`魔力反応：${e.magic_reaction}`,'battle',DEBUG)
    if (e.magic_reaction) {
      const mr_atk = c.armor.magic_value*e.rank
      const mr_def = c.weapon.magic_value*e.rank
      c.atk = mr_atk>c.atk? 0 : c.atk - mr_atk
      c.def = mr_def>c.def? 0 : c.def - mr_def    
log.add('魔力耐性',`敵の魔力反応によって、攻撃力が${mr_atk} ,、防御力が:${mr_def}減少 `)
    }

    ////てすとてすと
    //tesutesu

    // 特殊地形(聖域・原始林)処理
    if (this.sanctuary) {
      c.matk.dice = Math.trunc(c.matk.dice / 4)
      c.mdef.dice = Math.trunc(c.mdef.dice / 4)
    }

    // 水中処理
    if (this.underwater) {
      const water = c.race=='魚人'? 2 : -2
      c.spd += water
      c.hit += water
      c.avo += water
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
                const matk_effect = Math.min(Battle.battle_dice(tc.matk.dice), tc.matk.max)
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
            if (te.special_dice > 0) {
              const act_special_dice = Math.max(0, te.special_dice - tc.special_reduce - (te.special_element == tc.armor.element ? tc.armor.rank : 0))
              if (act_special_dice > 0) {
                const special_effect = Battle.battle_dice(act_special_dice)
                te.atk += special_effect
              }
            }

            // PCの魔法防御詠唱
            if (defensive_command == '魔法防御' && tc.mp >= 1) {
              const mdef_effect = Math.min(Battle.battle_dice(tc.mdef.dice), tc.mdef.max)
              tc.def += mdef_effect
              tc.mp--
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
      detail: log.result('battle'),
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
      const r = this.exec(!i)
      if (r?.result === 1) {
        stat.win++
      }
      else if (r?.result === 0) {
        stat.draw++
      }
      else if (r?.result === -1) {
        stat.lose++
      } else { throw { message: 'なんか変な結果返ってるよ',value:r?.result } }
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
  /**
   * commands [[off1,def1],[off2,def2],[off3,def3]]
   */
  constructor(commands) {
    this.offense1 = commands[0][0]
    this.offense2 = commands[1][0]
    this.offense3 = commands[2][0]
    this.defense1 = commands[0][1]
    this.defense2 = commands[1][1]
    this.defense3 = commands[2][1]
  }

  offense(turn = null) {
    if (turn === null) { return [offense1, offense2, offense3] }
    if ([1, 2, 3].includes(turn)) {
      return eval(`this.offense${turn}`)
    } else {
      throw { message: 'そんなターンはないよ',value:turn }
    }
  }
  defense(turn = null) {
    if (turn === null) { return [defense1, defense2, defense3] }
    if ([1, 2, 3].includes(turn)) {
      return eval(`this.defense${turn}`)
    } else {
      throw { message: 'そんなターンはないよ',value:turn }
    }
  }
  turn(turn) {
    if ([1, 2, 3].includes(turn)) {
      return eval(`[this.offense${turn},this.defense${turn}]`)
    } else {
      throw { message: 'そんなターンはないよ',value:turn }
    }
  }

  static get ATTACK_COMMAND() { return ['通常攻撃', '全力攻撃', '正確攻撃', '魔法攻撃', '専守防衛'] }
  static get DEFENCE_COMMAND() { return ['通常防御', '全力防御', '回避体勢', '魔法防御', '逃走'] }
}

