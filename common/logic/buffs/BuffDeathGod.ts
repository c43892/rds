
// 死神
class BuffDeathGod extends Buff {
    constructor() {
        super("BuffDeathGod");
        this.onPlayerActed = async (ps) => {
            var p = <Player>this.getOwner();
            var bt:Battle = p.bt();
            var num = ps.num;
            if(ps.subType == "useElem"){
                var extra = ps.e.attrs.esOnNormalAttack;
                num = extra ? num - extra : num;
            }

            await bt.implAddDeathGodStep(num, undefined, "deathGodBuff");
            if (p.deathStep == 0 && !bt.level.map.findFirstUncoveredElem((e:Elem) => e.type == "DeathGod"))
                await this.doEffect();
        };

        this.doEffect = async () => {
            var bt:Battle = this.getOwner().bt();
            var dg = bt.level.createElem("DeathGod");
            var g = BattleUtils.findRandomEmptyGrid(bt);
            if (!g) return; // 没空位了
            await bt.implAddElemAt(dg, g.pos.x, g.pos.y);
        }
    }
}
