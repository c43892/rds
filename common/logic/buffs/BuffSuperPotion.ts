// 超能药水提供的buff
class BuffSuperPotion extends Buff{
    constructor(cnt:number){
        super("BuffSuperPotion");
        this.cnt = cnt;

        this.onPlayerActed = async () => {
            var bt:Battle = this.getOwner().bt();
            this.cnt --;
            if(this.cnt <= 0)
                await bt.implRemoveBuff(this.getOwner(), this.type);
        };

        // 免疫突袭
        this.onSneaking = (ps) => {
            if (ps.immunized) return;

            ps.immunized = true;
            Utils.log("immunize sneak");
        };

        // 免疫攻击伤害和buff
        this.onCalcAttacking = (ps) => {
            if(ps.subType != "monster2targets")
                return;

            ps.targetAttrs.immuneFlags.push("cancelAttack");
        };

        this.addBuffCnt = (cnt, newCnt) => this.cnt = newCnt;
    } 
}