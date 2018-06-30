// 世界地图数据
class WorldMap {
    public stories; // 所有层
    public conns; // 层间连接关系
    public xpos; // 每一层节点的水平位置的值，虽然只是显示用，但要存下来

    constructor() {
        this.stories = [];
        this.conns = [];
        this.xpos = [];
    }

    // 从指定配置数据生成一个大地图
    public static buildFromConfig(world):WorldMap {
        var rand:SRandom = new SRandom(undefined);
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
        var l = cfg.totalLevels - 1;
        for (var i = 0; i < l; i++) {
            var num = rand.nextInt(2, 5);
            var s = [];
            var xpos = [];
            var x = 0;
            for (var j = 0; j < num; j++) {
                s.push(i == l - 1 ? "camp" : "normal");
                x = rand.nextInt(0, 10);
                xpos.push(x);
            }

            w.stories.push(s);
            xpos.sort();
            
            // 确保位置不重叠
            for (var j = 0; j < xpos.length - 1; j++)
                if (xpos[j + 1] <= xpos[j])
                    xpos[j + 1] += 1;

            w.xpos.push(Utils.map(xpos, (p) => p / 10));
        }
        w.stories.push(["boss"]);
        w.xpos.push([0.5]);

        // 先分配固定配置点
        for (var fixStorey in cfg.fixedSpecs) {
            var n = parseInt(fixStorey);
            for (var i = 0; i < w.stories[n].length; i++)
                w.stories[n][i] = cfg.fixedSpecs[fixStorey]
        }

        // 确定层间连接关系
        for (var i = 0; i < l - 1; i++) {
            var n1 = w.stories[i].length;
            var n2 = w.stories[i + 1].length;
            var nk = n1 + "_" + n2;
            var conns = GCfg.worldMapConnectionCfg[nk];
            var n = rand.nextInt(0, conns.length);
            w.conns.push(conns[n]);
        }

        w.conns.push([]); 
        for (var i = 0; i < w.stories[l - 1].length; i++)
            w.conns[l - 1].push([1]);

        return w;
    }
}