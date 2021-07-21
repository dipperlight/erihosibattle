class Charactor extends Clonable {
  constructor(race,job,policy,degree,strB=0,mndB=0,dexB=0,actHP=null,actMP=null ) {    
    super()
    this.race = race
    this.job = job
    this.policy = policy
    this.degree = degree // 学院生：0　学士：1　公式：2　修士：3
    this.maxhp =  Charactor.bonus[race].hp + Charactor.bonus[job].hp + Charactor.bonus[policy].hp
    this.maxmp = Math.floor(Charactor.bonus[race].mp + Charactor.bonus[job].mp + Charactor.bonus[policy].mp)
    this.hp = isNumber(actHP) ? actHP : this.maxhp
    this.mp = isNumber(actMP) ? actMP : this.maxmp

    // calc
    this.str = Charactor.bonus[race].str + Charactor.bonus[job].str + Charactor.bonus[policy].str + strB
    this.mnd = Charactor.bonus[race].mnd + Charactor.bonus[job].mnd + Charactor.bonus[policy].mnd + mndB
    this.dex = Charactor.bonus[race].dex + Charactor.bonus[job].dex + Charactor.bonus[policy].dex + dexB
  }

  static base_param(race,job,policy) {
    return [
      Charactor.bonus[race].str + Charactor.bonus[job].str + Charactor.bonus[policy].str,
      Charactor.bonus[race].mnd + Charactor.bonus[job].mnd + Charactor.bonus[policy].mnd,
      Charactor.bonus[race].dex + Charactor.bonus[job].dex + Charactor.bonus[policy].dex
    ]
  }
  static get bonus() {
    return {
      'bese'  :{str:2, mnd:2, dex:2, hp:16, mp:3,},
      '人間'  :{str:1, mnd:1, dex:1, hp:3,  mp:0.5,},
      '獣人'  :{str:2, mnd:0, dex:0, hp:11, mp:0,  },
      '魚人'  :{str:0, mnd:2, dex:0, hp:0,  mp:1,   },
      '小人'  :{str:0, mnd:0, dex:2, hp:0,  mp:0,   },
      '翼人'  :{str:1, mnd:1, dex:0, hp:3,  mp:0.5, },
      '竜人'  :{str:1, mnd:0, dex:1, hp:13, mp:0,   },
      '精霊'  :{str:0, mnd:1, dex:1, hp:0,  mp:2.5, },
      '戦士'  :{str:2, mnd:0, dex:0, hp:9,  mp:0,   },
      '武闘家':{str:1, mnd:0, dex:1, hp:6,  mp:0,   },
      '騎士'  :{str:1, mnd:1, dex:0, hp:5,  mp:0.5, },
      '賢者'  :{str:0, mnd:2, dex:0, hp:0,  mp:2,   },
      '修道者':{str:1, mnd:1, dex:0, hp:3,  mp:1.5, },
      '魔術師':{str:0, mnd:1, dex:1, hp:0,  mp:1.5, },
      '職人'  :{str:0, mnd:0, dex:2, hp:0,  mp:0,   },
      '狩人'  :{str:1, mnd:0, dex:1, hp:3,  mp:0,   },
      '医学士':{str:0, mnd:1, dex:1, hp:0,  mp:0.5, },
      '肉体'  :{str:2, mnd:0, dex:0, hp:6,  mp:0,   },
      '知性'  :{str:0, mnd:2, dex:0, hp:0,  mp:1,   },
      '技巧'  :{str:0, mnd:0, dex:2, hp:0,  mp:0,   },
      '実践'  :{str:1, mnd:1, dex:0, hp:3,  mp:0.5, },
      '経験'  :{str:1, mnd:0, dex:1, hp:3,  mp:0,   },
      '理論'  :{str:0, mnd:1, dex:1, hp:0,  mp:0.5, }
    }
  }

}

class BattleCharactor extends Charactor {
  constructor(weapon,armor,...args){
    super(...args)
    this.weapon = weapon
    this.armor = armor

    // calc
    this.spd = Math.floor((this.dex()+this.str())/2)+ (['獣人'].includes(this.race)?2:0) + (['武闘家'].includes(this.job)?2:0) + Math.ceil(this.degree/2)+this.weapon.spd + this.armor.spd
    this.hit = Math.floor(this.dex()/2) + (['獣人'].includes(this.race)?1:0) + (['武闘家','狩人'].includes(this.job)?1:0)              +this.weapon.hit + this.armor.hit
    this.avo = Math.floor(this.dex()/2) + (['獣人'].includes(this.race)?1:0) + (['武闘家'].includes(this.job)?1:0)              +this.weapon.avo + this.armor.avo
    this.atk = this.str() + (['戦士'].includes(this.job)?5:0) + weapon.material_value
    this.def = this.str() + (['戦士','騎士'].includes(this.job)?5:0) + (['槍'].includes(weapon.type)? Math.floor(weapon.process_value/2) :0)

    this.matk = {
      dice:Math.floor(this.mnd/2) + weapon.magic_value + (this.job=='魔術師'?1:0),
      max:25+this.mnd*3+weapon.rank*10+this.degree*5,
      free: false,
      add: (['杖'].includes(weapon.type)? weapon.magic_value : 0)
    }
    this.mdef = {
      dice: Math.floor(this.mnd/2) + armor.magic_value,
      max:  25+this.mnd*3+armor.rank*10+this.degree*5,
      free: ['護符','帽子','魔法衣'].includes(armor.type),
      add:  0
    }
    this.special_reduce = 0
    this.crit_multi = 0.2
    this.crit_taken = 0.2
    this.regen = 0
    this.curse = 0
    this.ghost_effect = 0
    this.box_effect = 0
    this.box_speed = 0

    // 属性共鳴
    this.mode = (ELEMENTS.include(weapon.element) && weapon.element==armor.element) ? weapon.element : '無'
    const rank = weapon.rank + armor.rank
    switch(mode){
      case '無':
        break;
      case '火':
        this.hit += Math.floor(rank/5);
        this.atk += rank*2
        this.def += rank*-1
        break;
      case '水':
        this.def += rank
        this.special_reduce += Math.floor(rank/5)+1;
        break;
      case '風':
        this.spd += 4;
        this.hit += Math.floor(rank/5);
        this.avo += Math.floor(rank/5);
        break;
      case '地':
        this.spd += Math.floor(rank/-2);
        this.def += rank*2
        this.crit_taken += -0.2
        break;
      case '甘':
        this.matk.free = true
        break;
      case '苦':
        this.def += rank
        this.regen += Math.floor(rank/2);
        break;
      case '塩':
        this.ghost_effect += rank*3
        break;
      case '酸':  
        this.box_spd += 8;　
        this.box_effect += rank*2
        break;
      case '辛':
        this.curse += Math.floor(rank/1.5)
        break;
      case '毒':
        this.avo += Math.floor(rank/5);
        this.crit_multi += 0.4
        break;
      default:
        throw {message:'知らない属性共鳴',element:mode}
    }
  }
  static get clone_properties() {
		return ['weapon','armor']
	}

  command(...commands){
    let full_atk_ref;
    switch(this.weapon.type){
      case 'グリモア':
        full_atk_ref = this.character.mnd()
        break;
      case '爆薬':
        full_atk_ref = this.character.dex()
        break;
      default:
        full_atk_ref = this.character.str()
    }

    for (const command of commands) {
      switch (command){
        // 攻撃系コマンド
        case '通常攻撃':
          break;
        case '全力攻撃':　　//全力攻撃は一応、ターン開始時に発動してステ変動もそのときに行われる想定 /* UNCERTAIN */
          if (this.weapon.weight()=='重' && hp>2){
            this.atk += full_atk_ref *2 + Math.floor(this.weapon.process_value/2)
            this.def += full_atk_ref *-1
            this.spd += -1
            this.hp--; this.hp--;
          }
          else if (hp>1){
            this.atk += full_atk_ref *2
            this.def += full_atk_ref *-1
            this.spd += -1
            this.hp--
          }
          break;
        case '正確攻撃':
          this.spd += -1
          this.hit += 1;
          this.avo += -1
          break;
        case '魔法攻撃':　　//魔法攻撃の詠唱はPCの攻撃する直前　ここでは計算しない/* UNCERTAIN */
          break;
        case '専守防衛':
          this.def += full_atk_ref *2
          break;
        // 防御系コマンド
        case '通常防御':
          break;
        case '全力防御':
          this.atk += full_atk_ref *-1
          this.def += full_atk_ref *2
          if (this.armor.type=='大盾'){
            this.def += Math.floor(this.armor.process_value/2)
          }
          break;
        case '回避体勢':
          this.spd += -1
          this.hit += -1;
          this.avo += 1
          break;
        case '魔法防御':  //魔法防御の詠唱はPCが攻撃される直前　ここでは計算しない/* UNCERTAIN */
          break;
        case '逃走':
          break;
        default:
          throw {message:'知らない戦闘コマンド',command:command}
      }
    }
  }
}