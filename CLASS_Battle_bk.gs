class Battle {
  constructor(character,enemy,weapon,armor,command,area){
    this.character = character
    this.enemy = enemy
    this.weapon = weapon
    this.armor = armor
    this.command = command
    this.area = area

    // キャラステ分計算
    this.b_spd = Math.floor((character.dex()+character.str())/2)+ (['獣人'].includes(character.race)?2:0) + (['武闘家'].includes(character.job)?2:0) + Math.ceil(character.degree/2)
    this.b_hit = Math.floor(character.dex()/2) + (['獣人'].includes(character.race)?1:0) + (['武闘家','狩人'].includes(character.job)?1:0)
    this.b_avo = Math.floor(character.dex()/2) + (['獣人'].includes(character.race)?1:0) + (['武闘家'].includes(character.job)?1:0)
    this.b_atk = character.str() + (['戦士'].includes(character.job)?5:0)
    this.b_def = character.str() + (['戦士','騎士'].includes(character.job)?5:0)

    // 装備分適応
    this.b_spd += weapon.spd() + armor.spd()
    this.b_hit += weapon.hit() + armor.hit()
    this.b_avo += weapon.avo() + armor.avo()
    this.b_atk += weapon.material_value
    this.b_def += armor.material_value + (['槍'].includes(weapon.type)? Math.floor(weapon.process_value/2) :0)

    this.b_matk_dice =  Math.floor( Math.floor(character.mnd()/2) + weapon.magib_value + (character.job=='魔術師'?1:0) ) /  (['原始林','聖域'].includes(area)?4:1)
    this.b_mdef_dice = 0　//魔防は0でいい？
    this.b_matk_max = 25+character.mnd()*3+weapon.rank*10+character.degree*5 - enemy.rank*5 - enemy.magib_resist
    this.b_mdef_max = 25+character.mnd()*3+armor.rank*10+character.degree*5 - enemy.rank*5 - enemy.magib_resist
    this.b_matk_free = false
    this.b_mdef_free = ['護符','帽子','魔法衣'].includes(armor.type)
    this.b_matk_add =  ['杖'].includes(weapon.type)? weapon.magib_value : 0
    this.b_matk_add =  0

    this.b_special_reduce = 0

    this.b_crit_multi = 1.2
    this.b_crit_taken = 1.2
    this.b_regen = 0
    this.b_curse = 0
    this.b_penetration = weapon.weight()=='重'? Math.floor(enemy.def*(20-enemy.r)/100) : 0　//辛セットで防御減少してから重武器でなぐった時は対応できる？

    // 属性共鳴適応
    this.mode = (ELEMENTS.include(weapon.element) && weapon.element==armor.element) ? weapon.element : '無'
    if (mode!='無'){
      const rank = weapon.rank + armor.rank
      switch(mode){
        case '火':
          this.b_hit += Math.floor(rank/5);
          this.b_atk += rank*2
          this.b_def += rank*-1
          break;
        case '水':
          this.b_def += rank
          this.b_special_reduce += Math.floor(rank/5)+1;
          break;
        case '風':
          this.b_spd += 4;
          this.b_hit += Math.floor(rank/5);
          this.b_avo += Math.floor(rank/5);
          break;
        case '地':
          this.b_spd += Math.floor(rank/-2);
          this.b_def += rank*2
          this.b_crit_taken += -0.2
          break;
        case '甘':
          this.b_matk_free = true
          break;
        case '苦':
          this.b_def += rank
          this.b_regen += Math.floor(rank/2);
          break;
        case '塩':
          if (enemy.race == '死霊'){
            this.b_atk += rank*3
            this.b_def += rank*3
          }
          break;
        case '酸':
          this.b_spd += 8;　//スピード増加も器物相手のみなはず
          if (enemy.race == '器物'){            
            this.b_atk += rank*2
          }
          break;
        case '辛':
          this.b_curse += Math.floor(rank/1.5)
          break;
        case '毒':
          this.b_avo += Math.floor(rank/5);
          this.b_crit_multi += 0.4
          break;
      }
    }
  }

  exec(detail=false){
    let bc_hp = this.character.acthp
    let bc_mp = this.character.actmp
    let bc_atk = this.b_atk
    let bc_def = this.b_def
    let bc_hit = this.b_hit
    let bc_avo = this.b_avo
    let bc_spd = this.b_spd
    let be_hp = this.enemy.hp
    let be_atk = this.enemy.atk
    let be_def = this.enemy.def

    let turn = 1
    let esc = false
    let text =''
    const character_move = this.b_spd >= this.enemy.spd
    do{
      let ex_def = false;
      // 戦闘処理
      // ターン開始時処理　辛セット効果等
      for(let i=0;i<2;i++){
        // 行動前処理　必要？

        if (character_move) {
          // 自分の攻撃
          switch (this.command.turn(turn)[0]){
            case '通常攻撃':
              break;
            case '全力攻撃':
              if (bc_hp>(this.weapon.weight=='重'?2:1)){
                bc_atk += _fullatk_base() *2
                bc_def += _fullatk_base() *-1
                bc_spd += -1
                bc_hp--
                if (this.weapon.weight=='重'){
                  this.b_atk += Math.floor(this.weapon.process_value/2)
                  bc_hp--
                }
              }
              break;
            case '正確攻撃':
              this.b_spd += -1
              this.hit += 1;
              this.avo += -1
              break;
            case '魔法攻撃':
              if (bc_mp>=1){
                const c_matk = min(battle_dice(this.b_matk_dice),this.b_matk_max)
                this.b_atk += c_matk
                if (['杖'].includes(weapon.type)){
                  this.b_atk += weapon.magib_value
                }
                b_mp += this.b_matk_free? 0 : -1
              }
              break;
            case '専守防衛':
              ex_def = true;
              this.b_def += this.character.dex() *2
              break;
          }
          // 攻撃処理
            //弱点
            if(this.weapon.element==this.enemy.week_element){
              const week_atk = battle_dice(this.weapon.rank)
              this.b_atk += week_atk
            }

            // ダメージ算出
            const damage = this.b_atk - this.enemy.def
            // 必中判定
            if (this.b_hit>=this.enemy.avo){
              damage *= this.b_crit_multi
            }
          // 死亡判定
          be_hp -= damage
          if(be_hp<0){  // 敵死亡 勝利
            return {
              result: e_hp<0? 1 : (b_hp<0? -1 : 0), // 勝利：1　引き分け：0　敗北　-1
              detail: text,
              damage: this.character.acthp - b_hp
            }
          }
          character_move= !character_move
        }else{
          // 敵の攻撃
          switch (this.command.turn(turn)[1]){
            case '通常防御':
              break;
            case '全力防御':
                this.b_atk += this.character.str() *-1
                this.b_def += this.character.str() *2
                if (this.armor.type=='大盾'){
                  this.b_def += Math.floor(this.armor.process_value/2)
                }
              break;
            case '回避体勢':
              this.b_spd += -1
              this.hit += -1;
              this.avo += 1
              break;
            case '魔法防御':
              if (bc_mp>=1){
                const mdef = min(battle_dice(this.b_mdef_dice),this.b_mdef_max)
                this.b_def += mdef
                b_mp += this.b_mdef_free? 0 : -1
              }
              break;
            case '逃走':
              esc = true
              break;
          }
          // 防御処理
          // 必中判定
          // ダメージ算出
          // 死亡判定
            // 特殊攻撃
            if(this.enemy.b_special_atk_dice>0){
              const e_sdice = max(0,this.enemy.b_special_atk_dice - this.b_special_reduce - ( this.enemy.special_element==this.armor.element?this.armor.rank:0))
              if (e_sdice>0){
                const e_satk = battle_dice(this.enemy.b_special_atk_dice - this.b_special_reduce)
                this.b_atk += week_atk
              }
            }

            // ダメージ算出
            const damage = this.enemy.atk - this.enemy.def
            // 必中判定
            if (this.b_hit>=this.enemy.avo){
              damage *= this.b_crit_multi
            }
          // 死亡判定
          be_hp -= damage
          if(be_hp<0){  // 敵死亡 勝利
            return {
              result: e_hp<0? 1 : (b_hp<0? -1 : 0), // 勝利：1　引き分け：0　敗北　-1
              detail: text,
              damage: this.character.acthp - b_hp
            }
          }

          character_move= !character_move
        }
      }
      // ターン終了時処理
      // 逃走、等
      turn++
    }while(b_hp>=0 && e_hp>=0 && turn<=3 && !esc)

    return {
      result: e_hp<0? 1 : (b_hp<0? -1 : 0), // 勝利：1　引き分け：0　敗北　-1
      detail: text,
      damage: this.character.acthp - b_hp
    }
  }

// ***************************************************************************
  _fullatk_base(){
    let base;
    switch(this.weapon.type){
      case 'グリモア':
        base = this.character.mnd()
        break;
      case '爆薬':
        atk = this.character.dex()
        break;
      default:
        atk = this.character.str()
    }
    return base
  }
}


class Command {
  constructor(off1,off2,off3,def1,def2,def3){
    this.offense1 = off1
    this.offense2 = off2
    this.offense3 = off3
    this.defense1 = def1
    this.defense2 = def2
    this.defense3 = def3
  }

  offense(){
    return [offense1,offense2,offense3]
  }
  defense(){
    return [defense1,defense2,defense3]
  }
  turn(n){
    if ([1,2,3].includes(n)){
      return eval(`[this.offense${n},this.defense${n}]`)
    }else{
      throw {message:'そんなターンはないよ'}
    }
  }
}

function battle_dice(n){
  let sum =0;
  for (let i=0;i<n;i++){
    const deme = Math.floor( Math.random() * 11 )
    sum += deme==10? 15 : (deme==1? -3 : deme)
  }
  return sum<0?0:sum
}


const ATTACK_COMMAND = ['通常攻撃','全力攻撃','正確攻撃','魔法攻撃','専守防衛']
const DEFENCE_COMMAND = ['通常防御','全力防御','回避体勢','魔法防御','逃走']
const ELEMENTS = ['火','水','風','地','甘','苦','塩','酸','辛','毒']