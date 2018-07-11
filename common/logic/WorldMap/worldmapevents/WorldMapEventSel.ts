
// 大地图事件选项
class WorldMapEventSel {
    public getDesc; // 获取玩家可见的描述
    public valid; // 获取选项的当前可用性
    public exec; // 执行该选项，返回值表示是否保留对话

    constructor(ps, valid = () => true, exec = undefined) {
        this.getDesc = () => {
            var desc = ps.desc;
            for (var p in ps) desc = desc.replace("{"+p+"}", ps[p]);
            return desc;
        };
        this.valid = valid;
        this.exec = exec ? exec : () => false;
    }
}

// 根据指定配置创建选项集
class WorldMapEventSelFactory {

    // 创建一组选项
    public static createGroup(player:Player, group:string) {
        var sels = GCfg.getWorldMapEventSelGroupsCfg(group);
        var ss = [];
        for (var sel in sels) {
            var defaultPs = GCfg.getWorldMapEventSelsCfg(sel);
            var ps = sels[sel];
            var s = WorldMapEventSelFactory.creators[sel](player, Utils.merge(defaultPs, ps));
            ss.push(s);
        }

        return ss;
    }

    static creators = {

        // 离开
        "exit": (p:Player, ps) => new WorldMapEventSel(ps),

        // +钱-血
        "+coins-hp": (p:Player, ps) => new WorldMapEventSel(ps, () => true, () => {
            p.addMoney(ps.coins);
            p.addHp(-ps.hp);
        })
    };
}
