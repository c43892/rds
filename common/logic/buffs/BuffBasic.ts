
// 基本 buff：探开空地 +1 exp
class BuffBasic extends Buff {
    constructor() {
        super("BuffUncoveringAddExp");
        this.onGridChanged = async (ps) => {
            if (ps.stateBeforeUncover == GridStatus.Uncovered || ps.subType != "gridUncovered")
                return;

            var bt = this.getOwner().bt();
            await bt.implAddPlayerExp(1);
        }

        // 过关 40 死神步数
        this.beforeGoOutLevel2 = async() => {
            var bt:Battle = this.getOwner().bt();
            await bt.implAddDeathGodStep(40);
        }

        // 过关时清零玩家当前拥有的护甲
        this.beforeGoOutLevel2 = async() => {
            var bt:Battle = this.getOwner().bt();
            if(bt.player.shield != 0)
                await bt.implAddPlayerShield(-bt.player.shield);
        }

        this.doEffect = async () => {
        };
    }
}
