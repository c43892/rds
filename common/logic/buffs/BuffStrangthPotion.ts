// 力量药水提供的buff
class BuffStrangthPotion extends Buff{
    constructor(cnt:number){
        super("StrangthPotion");

        this.cnt = cnt;

        this.onPlayerActed = async () => {
            var bt:Battle = this.getOwner().bt();
            this.cnt --;
            if(this.cnt = 0)
                await bt.implRemoveBuff(this.getOwner(), this.type);
        };

        this.onAttacking = async (ps) => {
            var attackerAttrs = ps.attackerAttrs;
            if (!(attackerAttrs.owner instanceof Player)) return;
            attackerAttrs.power.b += 1;
        }

        this.preAttackBack = async (ps) => {
            if(!ps.achieve) return;

            ps.achieve = false;
        }

        this.addBuffCnt = (cnt, newCnt) => this.cnt = newCnt;
    }
}