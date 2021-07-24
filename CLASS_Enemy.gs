class Enemy extends Clonable {
  constructor(name, area, rank, hp, atk, def, hit, avo, spd, race, mresist, mreact, mreduce, weekelem, spe_elem,spe_dice ) {
    super()
    this.name = name
    this.area = area
    this.rank = rank
    this.hp = hp
    this.atk = atk
    this.def = def
    this.hit = hit
    this.avo = avo
    this.spd = spd
    this.race = race
    this.magic_resist = isNumber(mresist) ? mresist : 0
    this.magic_reaction = Boolean(mreact)
    this.magic_reduce = isNumber(mreduce) ? mreduce : 0
    this.week_element = weekelem
    this.special_element = spe_elem
    this.special_dice = spe_dice
  }
}