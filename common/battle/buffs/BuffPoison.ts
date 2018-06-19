
// 毒
class BuffPoison extends Buff {
    constructor(owner, cd) {
        super(owner, "BuffPoison");
        this.cd = cd;
        this.onPlayerActed = async () => {
            this.cd--;

            var bt:Battle = owner.getBattle();
            await this.doEffect();

            if (this.cd <= 0)
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
