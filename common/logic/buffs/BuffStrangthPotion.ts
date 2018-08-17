// 力量药水提供的buff
class BuffStrangthPotion extends Buff{
    constructor(cnt:number){
        super("StrangthPotion");

        this.cnt = cnt;

        this.onPlayerActed = async () => {
            var bt:Battle = this.getOwner().bt();
            this.cnt --;
            if(this.cnt <= 0)
                await bt.implRemoveBuff(this.getOwner(), this.type);
        };

        this.onCalcAttacking = async (ps) => {
            var attackerAttrs = ps.attackerAttrs;
            if (!(attackerAttrs.owner instanceof Player)) return;

            attackerAttrs.power.b += 1;
            if(Utils.indexOf(attackerAttrs.attackFlags, (s) => s == "immuneAttackBack") > -1) return;

            attackerAttrs.attackFlags.push("immuneAttackBack");
        }

        this.addBuffCnt = (cnt, newCnt) => this.cnt = newCnt;
    }
}