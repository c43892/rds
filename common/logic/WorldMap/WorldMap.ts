// 世界地图数据
class WorldMap {
    public cfg; // 地图配置
    public player:Player;
    public nodes:WorldMapNode[][];
    public bossType:string;

    // 从指定配置数据生成一个大地图
    public static buildFromConfig(worldName:string, p:Player):WorldMap {
        var w = new WorldMap();
        var cfg = GCfg.getWorldMapCfg(worldName);
        w.player = p;
        p.worldName = worldName;
        w.cfg = JSON.parse(JSON.stringify(cfg));
        // 根据特定规则得到本个所用的世界的随机数
        var worldmapRandom = new SRandom(p.worldmapRandomSeed + Utils.string2Number(worldName));
        WorldMapGenerator.worldMapGenerator(w, worldmapRandom);
        var bossTypes:string[] = GCfg.getMiscConfig("bossTypes");
        w.bossType = bossTypes[worldmapRandom.nextInt(0, bossTypes.length)];

        return w;
    }

    // 获取可到达的所有点
    public getValidNodes():WorldMapNode[]{
        var vns = [];
        for (var i = 0; i < this.nodes.length; i++) {
            for (var j = 0; j < this.nodes[i].length; j++) {
                if (this.nodes[i][j].hasParents())
                    vns.push(this.nodes[i][j]);
            }
        }
        return vns;
    }
}