
// 基本 buff：探开空地 +1 exp
class BuffBasic extends Buff {
    constructor(owner) {
        super(owner, "BuffUncoveringAddExp");
        this.onGridUncovered = async (x:number, y:number, statusBeforeUncovered:GridStatus) => {
            await this.doEffect();
        }

        this.doEffect = async () => {
            var bt = owner.bt();
            await bt.implAddPlayerExp(1);
        };
    }
}
