
// 毒
class BuffPoison extends Buff {
    constructor(owner, cnt) {
        super(owner, "BuffPoison");
        this.cnt = cnt;
        this.onPlayerActed = async () => {
            var bt:Battle = owner.getBattle();
            if (owner instanceof Player)
                await bt.implAddPlayerHp(-1);
            else
                await bt.implAddMonsterHp(owner, -1);

            this.cnt--;

            Utils.log(this.cnt);
            if (this.cnt <= 0)
                bt.implRemoveBuff(this.type);
        };
    }
}
