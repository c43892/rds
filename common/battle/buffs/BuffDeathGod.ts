
// 死神
class BuffDeathGod extends Buff {
    constructor() {
        super("BuffDeathGod");
        this.onPlayerActed = async () => {
            var p = <Player>this.getOwner();            
            var bt:Battle = p.bt();
            await bt.implAddPlayerAttr("deathStep", -1);
            if (p.deathStep == 0 && !bt.level.map.findFirstUncoveredElem((e:Elem) => e.type == "DeathGod"))
                await this.doEffect();
        };

        this.doEffect = async () => {
            var bt:Battle = this.getOwner().bt();
            var dg = ElemFactory.create("DeathGod", bt);
            var g = BattleUtils.findRandomEmptyGrid(bt);
            if (!g) return; // 没空位了
            await bt.implAddElemAt(dg, g.pos.x, g.pos.y);
        }
    }
}
