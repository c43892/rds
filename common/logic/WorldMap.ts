// 世界地图数据
class WorldMap {
    public worldCfg; // 地图配置
    public stories; // 所有层
    public conns; // 层间连接关系
    public xpos; // 每一层节点的水平位置的值，虽然只是显示用，但要存下来
    public player:Player;
    public nodes:WorldMapNode[][];

    constructor() {
        this.stories = [];
        this.conns = [];
        this.xpos = [];
    }

    // 从指定配置数据生成一个大地图
    public static buildFromConfig(world):WorldMap {
        var rand:SRandom = new SRandom();
        var w = new WorldMap();
        var cfg = GCfg.getWorldMapCfg(world);
        w.worldCfg = cfg;

        WorldMapGenerator.worldMapGenerator(w);

        return w;
    }

    public toString() {
        var wInfo = {
            stories:JSON.stringify(this.stories),
            conns:JSON.stringify(this.conns),
            xpos:JSON.stringify(this.xpos)
        };

        return JSON.stringify(wInfo);
    }

    public static fromString(str):WorldMap {
        var wInfo = JSON.parse(str);
        var worldmap = new WorldMap();
        worldmap.stories = JSON.parse(wInfo.stories);
        worldmap.conns = JSON.parse(wInfo.conns);
        worldmap.xpos = JSON.parse(wInfo.xpos);
        return worldmap;
    }
}