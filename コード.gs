const CALC_SHEET_NAME = '処理用シート';
const ENEMY_CELL_ROW = 2,
      ENEMY_CELL_COL = 7,
      BATTLE_SHEET_NAME = '勝率計算';

const MAX_ENEMY_ROW = 30,
      ENEMY_COL_SIZE = 22,
      ENEMYLIST_POS_ROW = 1,
      ENEMYLIST_POS_COL = 1;

var update_battle_group = ()=>{
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const cell = sheet.getActiveCell();
  const rangeRow = cell.getRow();
  const rangeCol = cell.getColumn();
  const value = cell.getValue();
  // Logger.log("**"+sheet.getName()+" , "+rangeRow+" , "+rangeCol+", "+value)

  if (sheet.getName()==BATTLE_SHEET_NAME && (rangeRow==ENEMY_CELL_ROW&&rangeCol==ENEMY_CELL_COL)) {
    const enemies = ss.getSheetByName(CALC_SHEET_NAME).getRange(ENEMYLIST_POS_ROW,ENEMYLIST_POS_COL,MAX_ENEMY_ROW,ENEMY_COL_SIZE).getValues();
    // Logger.log(JSON.stringify(enemies))
    let enemy_view = new Array(MAX_ENEMY_ROW).fill(new Array(ENEMY_COL_SIZE).fill(''));
    for (let i=0;i<MAX_ENEMY_ROW;i++){
      enemy_view[i] =(function (enemy){
        return Boolean(enemy.name)?[
          enemy.name,
          enemy.area,
          enemy.rank,
          range(enemy.min_hp,enemy.max_hp),
          range(enemy.min_atk,enemy.max_atk),
          range(enemy.min_def,enemy.max_def),
          range(enemy.min_hit,enemy.max_hit),
          range(enemy.min_avo,enemy.max_avo),
          range(enemy.min_spd,enemy.max_spd),
          enemy.race,
          enemy.magic_resist==0? '-' : enemy.magic_resist,
          enemy.magic_reaction? '有' : '-',
          enemy.magic_reduce==0? '-' : enemy.magic_reduce,
          enemy.week_element,
          Boolean(enemy.special_element) ? enemy.special_element+enemy.special_dice : '-'
       ]:new Array(15).fill('-');
      }( new Enemy(...enemies[i])))
    }
    // Logger.log(JSON.stringify(enemy_view))
    sheet.getRange(6,6,enemy_view.length,enemy_view[0].length).setValues(enemy_view)
  }
  return
}

var simulate_battle = ()=>{
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();
  const battle = new Battle(
      new BattleCharactor(        ),
      new Enemy(        ),
      new Command(        ),
      area
    )
  const stat = battle.run()
  /* TODO */
}
