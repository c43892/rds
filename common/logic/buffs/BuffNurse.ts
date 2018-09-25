
// 护士职业 buff
class BuffNurse extends Buff {
    constructor() {
        super("BuffNurse");

        this.onPlayerHealing = (ps) => {
            if(ps.source && ps.source.type == "HpPotion")
                ps.dhpPs.b += 1;
        }

        this.doEffect = async () => {};
    }
}
