
// 毒
class BuffPoison extends Buff {
    constructor(owner, cnt) {
        super(owner, "BuffPoison");
        this.cnt = cnt;
        this.onPlayerActed = async () => {
            this.cnt--;

            var bt:Battle = owner.getBattle();
            await this.doEffect();

            if (this.cnt <= 0)
                await bt.implRemoveBuff(this.type);
        };

        this.doEffect = async () => {
            var bt = owner.bt();
            if (owner instanceof Player)
                await bt.implAddPlayerHp(-1);
            else
                await bt.implAddMonsterHp(owner, -1);
        };
    }
}
