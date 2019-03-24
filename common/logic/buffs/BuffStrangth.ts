// 力量药水提供的buff
class BuffStrangth extends Buff{
    constructor(cnt:number){
        super("BuffStrangth");

        this.cnt = cnt;

        this.addAI("onPlayerActed", async () => {
            var bt:Battle = this.getOwner().bt();
            this.cnt --;
            if(this.cnt <= 0)
                await bt.implRemoveBuff(this.getOwner(), this.type);
        })

        this.addAI("onCalcAttacking", (ps) => {
            var attackerAttrs = ps.attackerAttrs;
            if (!(attackerAttrs.owner instanceof Player) || ps.isMultAndNot1st) return;

            attackerAttrs.power.b *= 2;
            if(Utils.indexOf(attackerAttrs.attackFlags, (s) => s == "immuneAttackBack") > -1) return;

            attackerAttrs.attackFlags.push("immuneAttackBack");
        }, true)

        this.overBuff = (newBuff:Buff) => this.cnt = cnt + newBuff.cnt;
    }
}