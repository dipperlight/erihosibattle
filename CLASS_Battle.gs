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
    const dice = new BattleDice()
    const log = ERIHOSHI_LOG
    log.clear('battle')    // 既存の　battle　グループをクリア
    log.set_group('battle') // ロググループを　battle に設定
    log.set_level(detail?1:2) // ログレベルを設定　detail? true:1 false:2

    const c = this.character.clone()
    const e = this.enemy.clone()
    const hp_before = c.hp
    const mp_before = c.mp

    //戦闘開始
    // 戦闘開始前処理 ***********************

    //敵特性反映
    // 装甲
    if(e.prop_armored){
      if (c.weapon.mark=="殴打"){
log.add('装甲','殴打の武具で、装甲を無効化！')
      }else{
        e.def += e.rank * 2
log.add('装甲',`敵の装甲！敵防御力が${e.rank * 2}上昇(${e.def})！`)
      }
    }

    // 軟体
    if(e.prop_slime){
      if (c.weapon.mark=="斬撃"){
log.add('軟体','斬撃の武具で軟体を無効化！')
      }else{
        e.def += Math.floor(e.rank * 1.5)
        c.penetrate = 0
log.add('軟体',`敵の軟体！敵防御力が${Math.floor(e.rank * 1.5)}上昇(${e.def})！防御貫通を無効化！`)
log.add('軟体',`敵の軟体！防御貫通を無効化！`)
      }
    }

    // 結界
    if(e.prop_barrier){
      if (c.weapon.mark=="刺突"){
log.add('結界','刺突の武具で結界を無効化！')
      }else{
        e.def += Math.floor(e.rank * 1.5)
        c.matk.max = Math.max(0,c.matk.max-10)
log.add('結界',`敵の結界！敵防御力が${Math.floor(e.rank * 1.5)}上昇(${e.def})！`)
log.add('結界',`敵の結界！魔法攻撃上限が10低下(${c.matk.max})！`)
      }
    }

    // 飛行
    if(e.prop_flying){
      if (c.weapon.mark=="射撃"){
log.add('飛行','射撃の武具で飛行を無効化！')
      }else{
        e.avo += 1 + Math.floor(e.rank/3)
log.add('飛行',`敵の飛行！敵回避が${1 + Math.floor(e.rank/3)}上昇！(${e.avo})`)
      }
    }
    // 属性耐性
      if(e.resist_element == c.weapon.element){
        c.atk = Math.max(0,c.atk-e.rank*3)
log.add('属性耐性',`敵の${e.resist_element}耐性！攻撃力が${e.rank*3}低下(${c.atk})！`)
      }


    if (c.weapon.weight()=='重') {
      c.penetrate -= e.rank
    }
    // 魔法最大値
    //敵ランク分
      c.matk.max -= e.rank * 5
      c.mdef.max -= e.rank * 5

    // 魔力耐性
log.log('魔力耐性',`魔力耐性：${e.magic_resist}`,'battle',DEBUG)
    if (e.magic_resist) {
      c.matk.max = Math.max(0,c.matk.max - e.magic_resist)
      c.mdef.max = Math.max(0,c.mdef.max - e.magic_resist)
    }
log.add('魔力最大値',`魔攻最大値:${c.matk.max} , 魔防最大値:${c.mdef.max} `)

    // 魔力反応処理
log.log('魔力耐性',`魔力反応：${e.magic_reaction}`,'battle',DEBUG)
    if (e.magic_reaction) {
      const mr_atk = c.armor.magic_value*e.rank
      const mr_def = c.weapon.magic_value*e.rank
      c.atk = Math.max(0, c.atk - mr_atk)
      c.def = Math.max(0, c.def - mr_def)
log.add('魔力耐性',`敵の魔力耐性！攻撃力が${mr_atk}、防御力が${mr_def}減少！`)
    }

    // 特殊地形(聖域・原始林)処理
    if (this.sanctuary) {
      c.matk.dice = Math.trunc(c.matk.dice / 4)
      c.mdef.dice = Math.trunc(c.mdef.dice / 4)
    }

      //  Logger.log("PC" + c.spd +"   敵"+ e.spd + "  " + this.underwater)
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
        if (c.mode=='塩'){
        c.atk += c.ghost_effect
        c.def += c.ghost_effect
log.add('属性共鳴',`セイントモード！攻撃力が${c.ghost_effect}、防御力が${c.ghost_effect}増加！`)
        }
        break;
      case '器物':
        if (c.mode=='酸'){
        c.atk += c.box_effect
        c.spd += c.box_spd
log.add('属性共鳴',`デストロイヤーモード！攻撃力が${c.box_effect}、速度が${c.box_spd}増加！`)
        }
        break;
    }

log.add('戦闘開始時','戦闘開始')
log.add('区切り線',`---------------`) 
    do {
//log.log('ステ表示',`PC　攻撃：${c.atk},防御:${c.def}  敵　攻撃：${e.atk},防御:${e.def}`,'battle',DEBUG)
      // ターン開始時処理 **********************
      const tc = c.clone()  //ターン中にステが変化するためクローン

log.add('ターン開始時',`${turn}ターン！`)  

      //辛セット効果　最低0でマイナスにはならない
      if (tc.curse > 0) { 
        const curse_atk = e.atk>=tc.curse ? tc.curse　: e.atk
        const curse_def = e.def>=tc.curse ? tc.curse　: e.def

        e.atk -= curse_atk
        e.def -= curse_def
log.add('属性共鳴',`カースモード！敵の攻撃力が${curse_atk}減少！（${e.atk}）、防御力が${curse_def}減少！（${e.def}）`)    
      }

      const te = e.clone()　//ターン中にステが変化するためクローン

      //苦セット効果　全力のHP消費の前に判定されるか否かが結果に影響する　多分前だと考え、この位置に /* UNCERTAIN */
      tc.hp += tc.regen

      //　コマンドによるステ変化
      const offensive_command = this.command.offense(turn)
      const defensive_command = this.command.defense(turn)
      // 「PCの攻撃力」は「全力攻撃・魔法攻撃・弱点攻撃の影響を受けない」ものとして扱う/* UNCERTAIN */
      // 霊体効果
      if(e.prop_spirit){
        if (offensive_command=="魔法攻撃"){
log.add('霊体','魔法攻撃で霊体を無効化！')
        }else{
          tc.atk = Math.max(0,tc.atk-te.rank*3)
log.add('霊体',`敵の霊体！攻撃力が${te.rank*3}低下(${tc.atk})！`)
        }
      }
      tc.command(offensive_command, defensive_command)

      if(tc.weapon.mark == "射撃"){
        tc.atk += Math.floor(tc.spd/3)
log.add('射撃',`射撃武具により攻撃力が${Math.floor(tc.spd/3)}上場(${tc.atk})！`)
      }



      //行動順判定 PC先手：true PC後手：false
      let character_move = tc.spd >= te.spd // 同値はPC有利のためPC先手
      if(te.name=='パープルボックス'){
        //Logger.log("PC" + tc.spd +"   敵"+ te.spd)
      }
log.add('イニシアチブ',`先手：${character_move?tc.name:te.name}`)  
      // 戦闘処理
      for (let i = 0; i < 2; i++) {  //先手が0で後手が1　2になったら処理終わり
        // 行動前処理　必要？
        if (!eob){break;} // 先手で戦闘終了していれば後手は処理しない

        if (character_move) {
        // 自分の攻撃
log.add('PC攻撃開始',`${tc.name}の攻撃`)
          if (['専守防衛'].includes(offensive_command)) { // 専守防衛のときはまるごと飛ばす
            // 専守防衛
log.add('専守防衛',`専守防衛！防御力が${tc.dex*2}上昇！（${tc.def}）`)  
          }else{
            //弱点
            if (tc.weapon.element == te.week_element) {
              let dice_num = tc.weapon.rank
              if (te.race=="竜"){
                dice_num = Math.max(0,dice_num-3)
log.add('龍鱗','龍鱗logging')
              }
              dice.roll(dice_num)
              const week_effect = dice.sum()
              tc.atk += week_effect
log.add('弱点攻撃',`${te.week_element}弱点！`) 
log.add('弱点攻撃',dice.text()) 
log.add('弱点攻撃',`攻撃力が${dice.sum()}上昇！（${tc.atk}）`) 
            }

// コマンド表示
log.add('コマンド',`${offensive_command}！`) 

            //魔法攻撃詠唱 後手で魔力減少攻撃を受けてMPが0以下になった場合不発　/* UNCERTAIN */
            if (offensive_command == '魔法攻撃') {              
              if (tc.mp >= 1) {
                tc.mp--
                dice.roll(tc.matk.dice)
                const matk_effect = Math.min(dice.sum(), tc.matk.max)
                tc.atk += matk_effect
log.add('魔法攻撃',`詠唱！`)
log.add('魔法攻撃',dice.text())
log.add('魔法攻撃',`攻撃力が${matk_effect}上昇！（${tc.atk}、MP${tc.mp}）`) 
                if (['杖'].includes(tc.weapon.type)) {
                  tc.atk += tc.weapon.magic_value
log.add('杖効果',`${tc.weapon.type}効果！攻撃力がさらに${tc.weapon.magic_value}上昇！（${tc.atk}）`)
                }
                if (tc.matk.free) {
                  tc.mp++
log.add('属性共鳴',`ウィザードモード！MPが1回復！（MP${(tc.mp)}）`)
                }
              }else{
log.add('魔法攻撃',`MPが足りない為、失敗！`) 
              }
            }

            //防御貫通
            //「カースモードの影響を受ける、回避ダイスの影響は受けない、殴打性質と重武器の効果は加算『敵防御*(10+20-敵R貫通)』」　と扱う　/* UNCERTAIN */
            if (tc.penetrate>0) {
              const penetrate_effect = Math.floor(te.def * tc.penetrate / 100)
              te.def -= penetrate_effect
log.add('防御貫通',`防御貫通！敵の防御力を${penetrate_effect}無視！`) 
            }

            // 必中判定
            const avo_dice = te.avo - tc.hit

            // 敵の回避
            if (avo_dice > 0) {
              dice.roll(avo_dice)
              const avo_effect = dice.sum()
              te.def += avo_effect
log.add('敵回避',`敵の回避！`) 
log.add('敵回避',dice.text())
log.add('敵回避',`防御力が${avo_effect}上昇！（${te.def}）`) 
            }
            // 曲剣補正
            if(["曲剣"].includes(tc.weapon.type)){
              tc.atk += tc.hit
log.add('曲剣補正',`曲剣効果！攻撃力が${tc.hit}上昇！（${tc.atk}）`) 
            }
            // ダメージ算出
            let damage = Math.max(tc.atk - te.def,0)
            if (avo_dice <= 0) {
              const crit_effect = Math.floor(damage * tc.crit_multi)
log.add('必中',`必中！必中倍率${tc.crit_multi}。ダメージが${crit_effect}増加！`) 
              damage += crit_effect
            }

            // ダメージ処理
            if (damage > 0) {
              te.hp -= damage
log.add('ダメージ',`${te.name}に${damage}のダメージを与えた！（HP${te.hp}）`) 
            }else{
log.add('ダメージ',`${te.name}にダメージを与えられなかった！（HP${te.hp}）`) 

            }

            // 死亡判定
            if (te.hp < 0) {  // 敵死亡 勝利
log.add('敵死亡',`${te.name}を倒した！`) 
              result = 1
              eob = false
            }
          }
          character_move = !character_move
        } else {
          // 敵の攻撃
log.add('敵攻撃開始',`${te.name}の攻撃`)
          // 特殊攻撃
          if (te.special_dice > 0) {
log.add('敵特殊攻撃',`特殊攻撃！（${te.special_element}${te.special_dice}）`)
            let act_special_dice = te.special_dice
            if (te.special_element == tc.armor.element){
log.add('敵特殊攻撃',`防具属性一致！特殊ダイスを${tc.armor.rank}軽減！`)
              act_special_dice -= tc.armor.rank
            }
            if (tc.special_reduce>0){
              act_special_dice -= tc.special_reduce
log.add('敵特殊攻撃',`プロテクトモード！特殊ダイスを${tc.special_reduce}軽減！`)
            }
            act_special_dice = act_special_dice<0 ? 0 : act_special_dice
            if (act_special_dice > 0) {

              dice.roll(act_special_dice)
              const special_effect = dice.sum()
              te.atk += special_effect
log.add('敵特殊攻撃',dice.text())
log.add('敵特殊攻撃',`攻撃力が${special_effect}上昇！（${te.atk}）`) 
            }
          }

// コマンド表示
log.add('コマンド',`${defensive_command}！`) 

          // PCの魔法防御詠唱
          if (defensive_command == '魔法防御' ) {
            if(tc.mp >= 1){
              dice.roll(tc.mdef.dice)
              const mdef_effect = Math.min(dice.sum(), tc.mdef.max)
              tc.def += mdef_effect
              tc.mp--
log.add('魔法防御',`詠唱！`)
log.add('魔法防御',dice.text())
log.add('魔法防御',`防御力が${mdef_effect}上昇！（${tc.def}、MP${tc.mp}）`) 
              if (tc.mdef.free) {
                tc.mp++
log.add('魔法防御',`${tc.armor.type}効果！MPが1回復！（MP${(tc.mp)}）`)
              }
            }else{
log.add('魔法防御',`MPが足りない為、失敗！`) 
            }
          }

          // 必中判定
          const avo_dice = tc.avo - te.hit

          // PCの回避
          if (avo_dice > 0) {
            dice.roll(avo_dice)
            const avo_effect = dice.sum()
            tc.def += avo_effect
log.add('PC回避',`${tc.name}の回避！`) 
log.add('PC回避',dice.text())
log.add('PC回避',`防御力が${avo_effect}上昇！（${tc.def}）`) 
          }

          // ダメージ算出
          let damage = Math.max(te.atk - tc.def, 0)
          if (avo_dice < 0) {
            const crit_effect = Math.floor(damage * tc.crit_taken)
            damage += crit_effect
log.add('必中',`必中！必中倍率${tc.crit_taken}。ダメージが${crit_effect}増加！`) 
          }

          // ダメージ処理
          if (damage > 0) {
            tc.hp -= damage
log.add('ダメージ',`${tc.name}は${damage}のダメージを受けた！（HP${tc.hp}）`) 
            if (te.magic_reduce > 0) { // 魔力減少
              tc.mp -= te.magic_reduce
log.add('魔力減少',`${te.name}の魔力減少効果！${tc.name}はMPが${te.magic_reduce}減少！（MP${tc.mp}）`) 
            }
          }else{
log.add('ダメージ',`${tc.name}は攻撃を防いだ！（HP${tc.hp}）`) 

            }

          // 死亡判定
          if (tc.hp < 0) {  // PC死亡 敗北
            result = -1
            eob = false
log.add('自分死亡',`${tc.name}は倒れてしまった！`) 
          }
          character_move = !character_move
        }
      }
      // ターン終了時処理
      // 逃走
      if (eob && defensive_command == '逃走') {  // PC逃走 敗北
        result = -1
        eob = false
log.add('逃走',`${tc.name}は逃げ出した！`) 
      }
      // HP・MPをオリジナルに反映
      c.hp = tc.hp
      c.mp = tc.mp
      e.hp = te.hp
      turn++
log.add('区切り線',`---------------`) 
    } while (eob && turn <= 3)


log.add('結果',`${result==1?'勝利':result==0?'引き分け':'敗北'}！`) 
    return {
      result: result, // 勝利：1　引き分け：0　敗北　-1
      detail: log.result('battle',INFO),
      hp_used: hp_before - Math.min(c.hp, c.maxhp), // 戦闘中は最大値をこえて回復するが、終了時に最大値まで戻る
      mp_used: mp_before - Math.min(c.mp, c.maxhp)  // MPが増えることはなさそうだが一応
    }
  }

  run(times = 10, log = 10) {
    const loop = times > 1000 ? 1000 : times // 念の為最大回数制限
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
      const r = this.exec(i<log)
      if (r?.result === 1) {
        stat.win++
      }
      else if (r?.result === 0) {
        stat.draw++
      }
      else if (r?.result === -1) {
        stat.lose++
      } else { throw { message: 'なんか変な結果返ってるよ',value:r?.result } }
      if (r?.detail) {
        stat.texts.push(r.detail)
      }
      if (stat.hp_used[r.hp_used] == null) { stat.hp_used[r.hp_used] = 0 }//初回は作る
      stat.hp_used[r.hp_used]++

      if (stat.mp_used[r.mp_used] == null) { stat.mp_used[r.mp_used] = 0 }//初回は作る
      stat.mp_used[r.mp_used]++
    }
    return stat;
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

