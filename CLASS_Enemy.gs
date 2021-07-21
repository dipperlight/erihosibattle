class Enemy extends Clonable {
  constructor(name,area,rank,hp,atk,def,hit,avo,spd,race,mresist,mreact,mreduce,weekelem,speelem,spedice,) {
    super()
    this.name = name
    this.area = area
    this.rank = rank
    this.hp = hp
    this.atk = atk
    this.def =def
    this.hit = hit
    this.avo = avo
    this.spd = spd
    this.race = race,
    this.magic_resist = isNumber(mresist)?mresist:0
    this.magic_reaction = Boolean(mreact)
    this.magic_reduce = isNumber(mreduce)?mreduce:0
    this.week_element = weekelem
    this.special_element = speelem
    this.special_dice = spedice
  }
}