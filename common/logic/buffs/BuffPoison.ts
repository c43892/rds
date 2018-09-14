
// 毒
class BuffPoison extends Buff {
    constructor(cnt, damage) {
        super("BuffPoison");
        this.cnt = cnt;
        this.onPlayerActed = async () => {
            this.cnt--;
            var bt:Battle = this.getOwner().bt();
            await this.doEffect();

            if (this.cnt <= 0)
                await bt.implRemoveBuff(this.getOwner(), this.type);
        };

        this.doEffect = async () => {
            var bt = this.getOwner().bt();
            if (this.getOwner() instanceof Player)
                await bt.implAddPlayerHp(-damage);
            else
                await bt.implAddMonsterHp(this.getOwner(), -damage);
        };
    
        this.overBuff = (newBuff:Buff) => this.cnt = cnt + newBuff.cnt;
    }
}
