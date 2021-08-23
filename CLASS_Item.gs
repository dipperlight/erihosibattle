class Item extends Clonable {
  constructor(spec_text) {
    super()
    this.text = spec_text
    const r1 = spec_text.match(/^(?<name>〈.+〉)?\s*(?<category>.+)\(/)
    if (r1) {
    const r1n = r1.groups
      this.name = r1n.name.slice(1, -1)
      this.category = r1n.category
    }
    const regexp =
    this.category=="武具"? new RegExp(/武具\((?<rank>\d+)\)\/(?<value>\d+)\/(?<proc>\d+)\/(?<magic>\d+)\/(?<elem>.)\/(?<sign>【.+】作。)?(?<mark>.+)の武具：(?<type>.+)系。$/,'u') :
    this.category=="防具"? new RegExp(/防具\((?<rank>\d+)\)\/(?<value>\d+)\/(?<proc>\d+)\/(?<magic>\d+)\/(?<elem>.)\/(?<sign>【.+】作。)?防具：(?<type>.+)系。$/,'u') :
     null

    const r2 = spec_text.match(regexp)
    if (r2) {
      const r2n = r2.groups
      this.rank = Number(r2n.rank)
      this.material_value = Number(r2n.value)
      this.process_value = Number(r2n.proc)
      this.magic_value = Number(r2n.magic)
      this.element = r2n.elem
      this.signature = r2n.sign ? r2n.sign.slice(1, -3) : ''
      this.type = r2n.type
      this.mark = r2n.mark
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
