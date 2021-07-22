class Item extends Clonable {
  constructor(spec_text) {
    super()
    this.text = spec_text
    const r = spec_text.match(/^(?<name>〈.+〉)?\s*(?<category>.+)\((?<rank>\d+)\)\/(?<value>\d+)\/(?<proc>\d+)\/(?<magic>\d+)\/(?<elem>.)\/(?<sign>【.+】作。)?(?<type>.+)系。$/u)
    if (r) {
      const rn = r.groups
      this.name = rn.name.slice(1, -1)
      this.category = rn.category
      this.rank = rn.rank
      this.material_value = rn.value
      this.process_value = rn.proc
      this.magic_value = rn.magic
      this.element = rn.elem
      this.signature = rn.sign ? rn.sign.slice(1, -3) : ''
      this.type = (['武具', '防具'].includes(this.category)) ? rn.type.slice(3) : rn.type
    } else {
      this.name = ''
      this.category = ''
      this.rank = 0
      this.material_value = 0
      this.process_value = 0
      this.magic_value = 0
      this.element = '無'
      this.signature = ''
      this.type = ''
    }
  }

  weight() {
    return Item.TYPE_BONUS?.[this.type]?.weight ?? ''
  }
  hit() {
    return this.category == '武具' ? Math.floor((Item.TYPE_BONUS[this.type]?.rate ?? 0) * this.rank) : 0
  }
  avo() {
    return this.category == '防具' ? Math.floor((Item.TYPE_BONUS[this.type]?.rate ?? 0) * this.rank) : 0
  }
  spd() {
    return Item.TYPE_BONUS[this.type]?.spd ?? 0
  }

  static get TYPE_BONUS() {
    return {
      '短剣': { category: '武具', weight: '軽', rate: 1, spd: 1 },
      '投剣': { category: '武具', weight: '軽', rate: 1, spd: 2 },
      '直剣': { category: '武具', weight: '中', rate: 1 / 1.5, spd: 0 },
      '曲剣': { category: '武具', weight: '中', rate: 1 / 1.5, spd: 0 },
      '槍': { category: '武具', weight: '中', rate: 1 / 1.5, spd: 0 },
      '弓矢': { category: '武具', weight: '中', rate: 1 / 1.5, spd: 3 },
      '弓': { category: '武具', weight: '中', rate: 1 / 1.5, spd: 0 },
      '矢': { category: '武具', weight: '中', rate: 1 / 1.5, spd: 0 },
      '杖': { category: '武具', weight: '中', rate: 1 / 1.5, spd: 0 },
      'グリモア': { category: '武具', weight: '中', rate: 1 / 1.5, spd: 0 },
      '爆薬': { category: '武具', weight: '中', rate: 1 / 1.5, spd: 0 },
      '斧': { category: '武具', weight: '重', rate: 1 / 2, spd: -3 },
      '棍棒': { category: '武具', weight: '重', rate: 1 / 2, spd: -3 },
      '大剣': { category: '武具', weight: '重', rate: 1 / 2, spd: -2 },
      '服': { category: '防具', weight: '軽', rate: 1, spd: 1 },
      '護符': { category: '防具', weight: '軽', rate: 1, spd: 1 },
      '盾': { category: '防具', weight: '軽', rate: 1 / 1.5, spd: 0 },
      '部分鎧': { category: '防具', weight: '軽', rate: 1 / 1.5, spd: 0 },
      '帽子': { category: '防具', weight: '軽', rate: 1 / 1.5, spd: 0 },
      '魔法衣': { category: '防具', weight: '軽', rate: 1 / 1.5, spd: -2 },
      '大盾': { category: '防具', weight: '軽', rate: 1 / 2, spd: -2 },
      '全身鎧': { category: '防具', weight: '軽', rate: 1 / 2, spd: -3 },
    }
  }
}
