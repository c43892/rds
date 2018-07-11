
// 大地图事件选项
class WorldMapEventSel {
    public getDesc; // 获取玩家可见的描述
    public valid; // 获取选项的当前可用性
    public exec; // 执行该选项，返回值表示是否结束对话
}

// 根据指定配置创建选项集
class WorldMapEventSelFactory {

    // 创建一组选项
    public static createGroup(p:Player, group:string) {
        var sels = GCfg.getWorldMapEventSelGroupsCfg(group);
        return Utils.map(sels, (sel) => {
            var attrs = GCfg.getWorldMapEventSelsCfg(sel);
            return WorldMapEventSelFactory.creators[sel](p, attrs);
        });
    }

    static creators = {
        "exit": WorldMapEventSelFactory.exit
    };

    // 离开
    static exit(p:Player, attrs):WorldMapEventSel {
        var sel = new WorldMapEventSel();
        sel.getDesc = () => attrs.desc;
        sel.valid = () => true;
        sel.exec = () => true;
        return sel;
    }
}
