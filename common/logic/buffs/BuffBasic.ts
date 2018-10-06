
// 基本 buff：探开空地 +1 exp
class BuffBasic extends Buff {
    constructor() {
        super("BuffUncoveringAddExp");

        this.addAI("onGridChanged", async (ps) => {
            if (ps.stateBeforeUncover == GridStatus.Uncovered || ps.subType != "gridUncovered")
                return;

            var bt = <Battle>this.getOwner().bt();
            await bt.implAddPlayerExp(1, {x:ps.x, y:ps.y});
        })

        this.addAI("beforeGoOutLevel2", async () => {
            var bt:Battle = this.getOwner().bt();
            if(bt.player.shield != 0)
                await bt.implAddPlayerShield(-bt.player.shield);
            
            await bt.implAddDeathGodStep(40);
            Occupation.makeOccupationBuff(bt.player);
        })
    }
}
