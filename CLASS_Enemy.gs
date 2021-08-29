class Enemy extends Clonable {
  constructor(name, area, rank, hp, atk, def, hit, avo, spd, race, eresist, mreduce, prop_armored, prop_slime, prop_barrier, prop_flying, prop_spirit, weekelem, spe_elem, spe_dice) {
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
    this.magic_resist = race == "死霊" ? rank * 10 : ["魔霊", "妖魔"].includes(race) ? rank * 5 : 0
    this.magic_reaction = race == "死霊"
    this.resist_element = eresist
    this.magic_reduce = isNumber(mreduce) ? mreduce : 0
    this.prop_armored = prop_armored
    this.prop_slime   = prop_slime
    this.prop_barrier = prop_barrier
    this.prop_flying  = prop_flying
    this.prop_spirit  = prop_spirit
    this.week_element = weekelem
    this.special_element = spe_elem
    this.special_dice = spe_dice
  }
}