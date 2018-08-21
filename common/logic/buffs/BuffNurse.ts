
// 护士职业 buff
class BuffNurse extends Buff {
    constructor() {
        super("BuffNurse");

        this.onPlayerHealing = (ps) => {
            if(ps.source && ps.source.type == "HpPotion")
                ps.onPlayerHealingPs.dhpPs.b += 1;
        }

        // // 整场战斗的开局 +1 HpPotion
        // this.onLevelInited = async (x:number, y:number) => {
        //     var bt:Battle = this.getOwner().bt();
        //     if (bt.player.currentStoreyPos.lv != 1) return;

        //     // 随机找个揭开了的空白格子
        //     var g = BattleUtils.findRandomEmptyGrid(bt);
        //     if (g) {
        //         var hpPotion = bt.level.createElem("HpPotion");
        //         await Utils.delay(1000);
        //         await bt.implAddElemAt(hpPotion, g.pos.x, g.pos.y);
        //     }
        // }

        this.doEffect = async () => {};
    }
}
