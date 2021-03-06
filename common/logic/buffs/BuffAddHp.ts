
// +hp
class BuffAddHp extends Buff {
    constructor(cnt, heal) {
        super("BuffAddHp");
        this.cnt = cnt;

        this.addAI("onPlayerActed", async () => {
            this.cnt--;
            var bt:Battle = this.getOwner().bt();
            await this.doEffect();

            if (this.cnt <= 0)
                await bt.implRemoveBuff(this.getOwner(), this.type);
        })

        this.doEffect = async () => {
            var bt = this.getOwner().bt();
            if (this.getOwner() instanceof Player)
                await bt.implAddPlayerHp(heal, this);
            else
                await bt.implAddMonsterHp(this.getOwner(), heal);
        };

        this.overBuff = (newBuff:Buff) => this.cnt = cnt + newBuff.cnt;
    }
}
