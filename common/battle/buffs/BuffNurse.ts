
// 护士职业 buff
class BuffNurse extends Buff {
    constructor() {
        super("BuffNurse");

        // 开局 +1 HpPotion
        this.onLevelInited = async (x:number, y:number, statusBeforeUncovered:GridStatus) => {
            var bt = this.getOwner().bt();

            // 随机找个揭开了的空白格子
            var g = BattleUtils.findRandomEmptyGrid(bt);
            if (g) {
                var hpPotion = ElemFactory.create("HpPotion", bt, {dhp:10});
                await Utils.delay(1000);
                await bt.implAddElemAt(hpPotion, g.pos.x, g.pos.y);
            }
        }

        // 过关 +5 Hp
        this.onGoOutLevel = async() => {
            var bt = this.getOwner().bt();
            await bt.implAddPlayerHp(5);
        }

        this.doEffect = async () => {};
    }
}
