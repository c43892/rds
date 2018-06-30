// 世界地图数据
class WorldMap {
    static rand:SRandom = new SRandom(undefined);
    public stories; // 所有层

    constructor() {
        this.stories = [];
    }

    // 从指定配置数据生成一个大地图
    public static buildFromConfig(world):WorldMap {
        var w = new WorldMap();
        var cfg = GCfg.getWorldMapCfg(world);

        // 建立节点库和每一类节点出现的层级约束
        var candidates = [];
        var validLevels = {};
        for (var spec in cfg.specs) {
            validLevels[spec] = cfg.specs[spec].levels;
            for (var i = 0; i < cfg.specs[spec].num; i++)
                candidates.push(spec);
        }
        
        // 确定每层关卡数，最高两层是确定的 boss 和 camp
        for (var i = 0; i < cfg.totalLevels - 2; i++) {
            var num = WorldMap.rand.nextInt(2, 5);
            var s = [];
            for (var j = 0; j < num; j++)
                s.push("normal");

            w.stories.push(s);
        }

        // 先分配固定配置点
        for (var fixStorey in cfg.fixedSpecs) {
            var n = parseInt(fixStorey);
            for (var i = 0; i < w.stories[n].length; i++)
                w.stories[n][i] = cfg.fixedSpecs[fixStorey]
        }

        return undefined;
    }
}