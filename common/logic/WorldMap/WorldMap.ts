// 世界地图数据
class WorldMap {
    public cfg; // 地图配置
    public player:Player;
    public nodes:WorldMapNode[][];

    // 从指定配置数据生成一个大地图
    public static buildFromConfig(worldName:string, p:Player):WorldMap {
        var w = new WorldMap();
        var cfg = GCfg.getWorldMapCfg(worldName);
        w.player = p;
        w.cfg = JSON.parse(JSON.stringify(cfg));

        WorldMapGenerator.worldMapGenerator(w, p.playerRandom);

        return w;
    }

    public toString() {

        // 把所有 node 平摊成一维数组,存放位置和房间类型,单独存放父节点信息.
        var nodesArr = [];
        var nodesParents = [];
        Utils.NDimentionArrayForeach(this.nodes, (node:WorldMapNode) =>{
            var nodeStr = node.toString();
            var nodeParents = node.toStringForParents();
            nodesArr.push(nodeStr);
            nodesParents.push(nodeParents);
        });

        var wInfo = {nodesArr:nodesArr, nodesParents:nodesParents, cfg:this.cfg};
        return JSON.stringify(wInfo);
    }

    public static fromString(str):WorldMap {
        var worldmap = new WorldMap();
        var wInfo = JSON.parse(str);
        var cfg = wInfo.cfg;

        //生成不带连接关系的大地图
        var nodesArr = wInfo.nodesArr;      
        worldmap.cfg = cfg;
        worldmap.nodes = [];
        var index = 0;
        for (var lv = 0; lv <= cfg.totalLevels; lv++) {
            worldmap.nodes.push([]);
            for (var n = 0; n < cfg.width; n++) {
                var node : WorldMapNode;
                var nodeArr = JSON.parse(nodesArr[index]);
                node = new WorldMapNode(nodeArr.x, nodeArr.y, nodeArr.xOffset, nodeArr.yOffset);
                if(nodeArr.roomType){
                    node.roomType = nodeArr.roomType
                }
                worldmap.nodes[lv].push(node);
                index ++;
            }
        }
        
        //根据存放的父节点信息,重现连接关系
        var nodesParents = wInfo.nodesParents;
        var index = 0;
        for (var i = 0; i < worldmap.nodes.length; i++){
            for(var j = 0; j < worldmap.nodes[i].length; j++){
                if(nodesParents[index] != []){
                    var info = JSON.parse(nodesParents[index]);
                        for(var k = 0; k < info.length; k++){
                            var parent = WorldMapNode.getNode(info[k].x, info[k].y, worldmap.nodes);
                            var newRoute = new WorldMapRoute(parent, worldmap.nodes[i][j]);
                            // worldmap.nodes[i][j].addParent(parent);
                            // parent.addRoute(newRoute);
                        }
                    }
                index++;
            }
        }
        return worldmap;
    }
}