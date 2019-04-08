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
        w.cfg = JSON.parse(JSON.stringify(cfg));
        // 根据特定规则得到本个所用的世界的随机数
        var worldmapRandom = new SRandom(p.worldmapRandomSeed + Utils.string2Number(worldName));
        WorldMapGenerator.worldMapGenerator(w, worldmapRandom);
        // 确定boss
        // 正常模式
        if (p.difficulty != "level4") {
            var finishedBoss = Utils.map(p.finishedWorldMap, (wm) => wm.bossType);
            var bossTypes: string[] = Utils.filter(w.cfg.bossTypes, (t) => !Utils.contains(finishedBoss, t));
        }
        // 无尽模式
        else {
            var allBossTypes:string[] = GCfg.getMiscConfig("bossTypes");
            var bossNum = allBossTypes.length;
            var finishedNum = p.finishedWorldMap.length;
            var round = Math.floor(finishedNum / bossNum) + 1;
            var finishedBossThisRound = [];
            for(var i = (round - 1) * bossNum; i < p.finishedWorldMap.length; i++)                
                finishedBossThisRound.push(p.finishedWorldMap[i].bossType);            
            
            var bossTypes: string[] = Utils.filter(allBossTypes, (t) => !Utils.contains(finishedBossThisRound, t));            
        }
        Utils.assert(bossTypes.length > 0, "not enough bossType to set");
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