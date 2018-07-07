//生成世界地图
class WorldMapGenerator{
    public static worldMapGenerator(world):WorldMap{
        var rand:SRandom = new SRandom();
        var w = new WorldMap();
        var cfg = GCfg.getWorldMapCfg(world);

        var nodes = WorldMapGenerator.createNodes(w, cfg);

        WorldMapGenerator.createRoutes(cfg, nodes, rand);

        return w;
    }

    public static createNodes(worldMap, cfg):WorldMapNode[][]{//根据地图大小生成所有节点
        var nodes: WorldMapNode[][];
        var height = cfg.totalLevels;
        var width = cfg.width;

        for(var y = 0; y < height; y++){
            var row = [];
            for(var x = 0; x < width; x++){
                row.push(new WorldMapNode(x, y));
            }
            nodes.push(row);
        }
        return nodes;
    }


    public static createRoutes(cfg, nodes:WorldMapNode[][], rd:SRandom){//生成第一段路线,由看不见的一层至玩家出发的第1层(程序为-1至0)
        var rowSize = cfg.width;

        for(var i = 0; i < cfg.routesMax; i++){
            var startNode = rd.nextInt(0, rowSize-1);

            if(i == 0)
            var firstStartRow = startNode;//记下第一次的随机结果
            while(i == 1 && startNode == firstStartRow){//重复随机,保证至少有两条不同的出发路线
                startNode = rd.nextInt(0, rowSize-1);
            }
            WorldMapGenerator.createNextRoutes(nodes, new WorldMapRoute(new WorldMapNode(startNode, -1),new WorldMapNode(startNode, 0)) , rd);//继续生成路线
        }
    }

    public static createNextRoutes(nodes:WorldMapNode[][], route:WorldMapRoute, rd:SRandom){
        var currentRow = route.dstNode.y;//当前层
        var currentRowSize = nodes[currentRow].length;//当前层节点数
        var xOffset;
        
        if(route.dstNode.x == 0)
            xOffset = rd.nextInt(0, 1);
        else if(route.dstNode.x == currentRowSize - 1)
            xOffset = rd.nextInt(-1, 0);
        else
            xOffset = rd.nextInt(-1, 1);
        
        var targetNode = new WorldMapNode(route.dstNode.x + xOffset, route.dstNode.y + 1);//目标点

        var minAncestorGap = 3;
        var maxAncestorGap = 5;

        var currentNodeParents = route.dstNode.getParents;
        
    }
}