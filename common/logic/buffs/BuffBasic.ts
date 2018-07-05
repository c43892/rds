
// 基本 buff：探开空地 +1 exp
class BuffBasic extends Buff {
    constructor() {
        super("BuffUncoveringAddExp");
        this.onGridChanged = async (ps) => {
            if (ps.subType != "gridUnconvered") return;
            var bt = this.getOwner().bt();
            await bt.implAddPlayerExp(1);
        }

        // 过关 40 死神步数
        this.beforeGoOutLevel2 = async() => {
            var bt:Battle = this.getOwner().bt();
            await bt.implAddPlayerAttr("deathStep", 40);
        }

        this.doEffect = async () => {
        };
    }
}
