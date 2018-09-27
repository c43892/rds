
// 护士职业 buff
class BuffNurse extends Buff {
    constructor() {
        super("BuffNurse");

        this.addAI("onPlayerHealing", (ps) => {
            if(ps.source && ps.source.type == "HpPotion")
                ps.dhpPs.b += 1;
        }, true)

        this.doEffect = async () => {};
    }
}
