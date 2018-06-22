
// 基本 buff：探开空地 +1 exp
class BuffBasic extends Buff {
    constructor() {
        super("BuffUncoveringAddExp");
        this.onGridChanged = async (ps) => {
            if (ps.subType != "GridUnconvered") return;
            await this.doEffect();
        }

        this.doEffect = async () => {
            var bt = this.getOwner().bt();
            await bt.implAddPlayerExp(1);
        };
    }
}
