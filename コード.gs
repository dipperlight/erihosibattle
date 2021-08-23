const CALC_SHEET_NAME = '処理用シート',
  ENEMY_CELL_ROW = 25,
  ENEMY_CELL_COL = 2,
  BATTLE_SHEET_NAME = '勝率計算',
  ENEMY_TARGET_ROW = 3,
  ENEMY_TARGET_COL = 14,
  MAX_ENEMY_ROW = 30,
  ENEMY_COL_SIZE = 22,
  ENEMYLIST_POS_ROW = 1,
  ENEMYLIST_POS_COL = 1,
  ENEMY_OUTPUT_COL_SIZE = 15,
  RESULT_OUTPUT_COL_SIZE=7,
  LOG_SHEET_NAME='戦闘ログ'

function sumple(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const cell = sheet.getActiveCell();
  const rangeRow = cell.getRow();
  const rangeCol = cell.getColumn();
  if (sheet.getName() == BATTLE_SHEET_NAME){
    if (rangeRow == ENEMY_CELL_ROW && rangeCol == ENEMY_CELL_COL) {
  Logger.log("**"+sheet.getName()+" , "+rangeRow+" , "+rangeCol)
      update_battle_group()
    }
    if (rangeRow == 28 && rangeCol == 8) {
  Logger.log("**"+sheet.getName()+" , "+rangeRow+" , "+rangeCol)
      simulate_battle()
    }
  }
}

var update_battle_group = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const sheet_name = sheet.getSheetName()
  const cell = sheet.getActiveCell();
  const rangeRow = cell.getRow();
  const rangeCol = cell.getColumn();
  if(!(sheet_name==BATTLE_SHEET_NAME&&rangeRow==ENEMY_CELL_ROW&&rangeCol==ENEMY_CELL_COL)){return}
  const enemies = ss.getSheetByName(CALC_SHEET_NAME).getRange(ENEMYLIST_POS_ROW, ENEMYLIST_POS_COL, MAX_ENEMY_ROW, ENEMY_COL_SIZE).getValues();
  // Logger.log(JSON.stringify(enemies))

  let enemy_view = new Array(MAX_ENEMY_ROW);
  for (let i = 0; i < MAX_ENEMY_ROW; i++) {
    const enemy = enemies[i]
    enemy_view[i] =
      enemy[0] ? [
        enemy[0],
        enemy[1],
        enemy[2],
        ranged_text(enemy[3], enemy[4], 3),
        ranged_text(enemy[5], enemy[6], 3),
        ranged_text(enemy[7], enemy[8], 3),
        ranged_text(enemy[9], enemy[10], 2),
        ranged_text(enemy[11], enemy[12], 2),
        ranged_text(enemy[13], enemy[14], 2),
        enemy[15],
        enemy[16] || '-',
        enemy[17] ? '有' : '-',
        enemy[18] || '-',
        enemy[19],
        enemy[20] ? enemy[20] + enemy[21] : '-'
      ] : new Array(ENEMY_OUTPUT_COL_SIZE).fill('-');
  }
  // Logger.log(JSON.stringify(enemy_view))
  sheet.getRange(ENEMY_TARGET_ROW, ENEMY_TARGET_COL, MAX_ENEMY_ROW, ENEMY_OUTPUT_COL_SIZE).setValues(enemy_view)
  sheet.getRange(ENEMY_TARGET_ROW, ENEMY_TARGET_COL+ENEMY_OUTPUT_COL_SIZE, MAX_ENEMY_ROW, RESULT_OUTPUT_COL_SIZE).setValues(
    new Array(MAX_ENEMY_ROW).fill(new Array(RESULT_OUTPUT_COL_SIZE).fill('-'))
  )
  simulate_battle()
}

var simulate_battle = () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(BATTLE_SHEET_NAME)
  const sheet_log = ss.getSheetByName(LOG_SHEET_NAME)

  // キャラクター
  const name = sheet.getRange('C2').getValue()
  const arms = sheet.getRange('B10:B11').getValues().flat().map(arm => new Item(arm))
  const build = sheet.getRange('C15:C18').getValues().flat()
  build[3] = Charactor.degree_number(build[3])
  const bonus = sheet.getRange('H2:H4').getValues().flat()
  const act = sheet.getRange('L2:L3').getValues().flat()

  const battleCharactor = new BattleCharactor(...arms, name, ...build, ...bonus, ...act)

  // コマンド
  const command = new Command(sheet.getRange('C5:E7').getValues().map(row=>row.filter(val=>val)))

  // 地形
  const sanctuary = sheet.getRange('L6').getValue()
  const underwater = sheet.getRange('L7').getValue()

  // 敵配列
  const enemys = sheet.getRange('N3:AB32').getValues().map(row =>{
    if (row[0]&&row[0]!='-'){
      return new Enemy(
        row[0],
        row[1],
        row[2],
        pop_max(row[3]),
        pop_max(row[4]),
        pop_max(row[5]),
        pop_max(row[6]),
        pop_max(row[7]),
        pop_max(row[8]),
        row[9],
        row[10],
        typeof (row[11]) === "boolean" ? row[11] : ['有', '○', '◯', 1].includes(row[11]),
        row[12],
        row[13],
        row[14].match(/^([^\d]+)(\d+)$/)?.[1] ?? '？',
        row[14].match(/^([^\d]+)(\d+)$/)?.[2] ?? 0
      )
    }else{
      return null
    }
  })

  const time = sheet.getRange('H25').getValue()||10
  const log = 10
  let results = new Array(MAX_ENEMY_ROW)
  let logs = new Array(MAX_ENEMY_ROW)
  for (let i = 0; i < MAX_ENEMY_ROW; i++) {
    if (enemys[i]){

      const battle = new Battle(
        battleCharactor,
        enemys[i],
        command,
        sanctuary,
        underwater
      )

      // シミュ実行
      const stat = battle.run(time,log)

      // 消費HP分類 0,1~開始時HP(生存),-1~-10(ギリ死),-11~（大敗北）
      let lose_hp = new Array(4).fill(0)
      Object.keys(stat.hp_used).forEach(used => {
        switch (true) {
          case used == 0: lose_hp[0]+=stat.hp_used[used]; break;
          case used <= battleCharactor.hp: lose_hp[1]+=stat.hp_used[used]; break;
          case used <= battleCharactor.hp + 20: lose_hp[2]+=stat.hp_used[used]; break;
          default: lose_hp[3]+=stat.hp_used[used]
        }
      })

      // 結果出力
      results[i] = [
        stat.win,
        stat.draw,
        stat.lose,
        ...lose_hp
        ]
      logs[i] = stat.texts.map((log,idx)=>'〈'+ (idx+1) +'〉 '+ log.substr(log.lastIndexOf("\n")+1) +'\n'+log+'\n**********\n')
    }else{
      results[i] = new Array(RESULT_OUTPUT_COL_SIZE).fill('-')
      
      logs[i] = new Array(log)
    }

  }

  sheet.getRange(ENEMY_TARGET_ROW, ENEMY_TARGET_COL+ENEMY_OUTPUT_COL_SIZE, MAX_ENEMY_ROW, RESULT_OUTPUT_COL_SIZE).setValues(results)
  sheet_log.getRange(2, 2, MAX_ENEMY_ROW, log).setValues(logs)

}
