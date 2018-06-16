
// 死神
class BuffDeath extends Buff {
    constructor(owner) {
        super(owner);
        var p = <Player>owner;
        this.onPlayerActed = async () => {
            var bt:Battle = p.getBattle();
            await bt.implAddPlayerAttr("deathStep", -1);
            if (p.deathStep == 0 && !bt.level.map.findFirstUncoveredElem((e:Elem) => e.type == "DeathGod")) {
                var dg = ElemFactory.create("DeathGod", bt);
                Utils.log(dg.type);
                var g = BattleUtils.findRandomEmptyGrid(bt);
                if (!g) return; // 没空位了
                await bt.implAddElemAt(dg, g.pos.x, g.pos.y);
            }
        };
    }
}