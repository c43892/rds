
// 毒
class BuffPoison extends Buff {

    // 剩余总伤害
    public getTotalDamageLeft;

    constructor(cnt, damage) {
        super("BuffPoison");
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
                await bt.implAddPlayerHp(-damage);
            else
                await bt.implAddMonsterHp(this.getOwner(), -damage);
        };

        this.getTotalDamageLeft = () => this.cnt >= 0 ? this.cnt * damage : 0;
    
        this.overBuff = (newBuff:Buff) => this.cnt = cnt + newBuff.cnt;
    }
}
