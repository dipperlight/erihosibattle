class BattleLog {
  constructor(logging) {
    this.logging = logging
    this.logs = []
  }

  /* TODO */
  add(event, text, level = 1) {
    if (this.logging) {
      this.logs.push({
        event: event,
        text: text,
        level: level
      })
    }
  }

  result(level = 1) {
    //Logger.log(JSON.stringify(this.logs))
    return this.logs.filter(log => log.level <= level).map(log => log.text).join("\n")
  }
}