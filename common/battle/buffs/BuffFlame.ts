
// 燃烧
class BuffFlame extends Buff {
    constructor(cd) {
        super("BuffFlame");
        this.cd = cd;
        this.onPlayerActed = async () => {
            this.cd--;

            var bt:Battle = this.getOwner().bt();
            await this.doEffect();

            if (this.cd <= 0)
                await bt.implRemoveBuff(this.getOwner(), this.type);
        };

        this.doEffect = async () => {
            var bt = this.getOwner().bt();
            if (this.getOwner() instanceof Player)
                await bt.implAddPlayerHp(-1);
            else
                await bt.implAddMonsterHp(this.getOwner(), -1);
        };
    }
}
