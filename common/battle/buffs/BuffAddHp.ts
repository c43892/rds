
// +hp
class BuffAddHp extends Buff {
    constructor(cd) {
        super("BuffAddHp");
        this.cd = cd;
        this.onPlayerActed = async () => {
            this.cd--;
            var bt:Battle = this.getOwner().bt();
            await this.doEffect();

            if (this.cd <= 0)
                await bt.implRemoveBuff(this.getOwner(), this.type);
        };

        this.doEffect = async () => {
            Utils.log("add 1 hp");
            var bt = this.getOwner().bt();
            if (this.getOwner() instanceof Player)
                await bt.implAddPlayerHp(1);
            else
                await bt.implAddMonsterHp(this.getOwner(), 1);
        };
    }
}
