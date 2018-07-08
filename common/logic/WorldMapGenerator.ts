//生成世界地图
class WorldMapGenerator{
    public static worldMapGenerator(world):WorldMap{
        var rand:SRandom = new SRandom();
        var w = new WorldMap();
        var cfg = GCfg.getWorldMapCfg(world);

        var nodes = WorldMapGenerator.createNodes(w, cfg);

        nodes = WorldMapGenerator.createRoutes(cfg, nodes, rand);

        nodes = WorldMapGenerator.deleteRepeatRoutes(nodes);//去掉重复路线

        return w;
    }

    //根据地图大小生成所有节点
    public static createNodes(worldMap, cfg):WorldMapNode[][]{
        var nodes = new Array();
        var height = cfg.totalLevels;
        var width = cfg.width;

        for(var y = 0; y < height; y++){
            var row = [];
            for(var x = 0; x < width; x++){
                row.push(new WorldMapNode(x, y));
            }
            nodes[y] = row;
        }
        Utils.log("createNodes runned");
        return nodes;
    }


    public static createRoutes(cfg, nodes:WorldMapNode[][], rd:SRandom){//生成第一段路线,由看不见的一层至玩家出发的第1层(程序为-1至0)
        var rowSize = cfg.width;

        for(var i = 0; i < cfg.routesMax; i++){
            var startNode = rd.nextInt(0, rowSize);

            if(i == 0)
            var firstStartRow = startNode;//记下第一次的随机结果
            while(i == 1 && startNode == firstStartRow){//重复随机,保证至少有两条不同的出发路线
                startNode = rd.nextInt(0, rowSize);
            }

            var startRoute = new WorldMapRoute(WorldMapNode.getNode(startNode, -1, nodes), WorldMapNode.getNode(startNode, 0, nodes));
            WorldMapGenerator.createNextRoutes(nodes, startRoute, rd);//继续生成路线


        }
        Utils.log("createRoutes runned");
        return nodes;
    }

    public static createNextRoutes(nodes:WorldMapNode[][], route:WorldMapRoute, rd:SRandom){
        var currentNode = route.dstNode;//当前点
        var currentRow = currentNode.y;//当前层
        var currentRowSize = nodes[currentRow].length;//当前层节点数

        if(currentRow == nodes.length - 2){//判断是否是通往BOSS点的路线
            var centerX = (currentRowSize + 1) / 2;
            targetNode = WorldMapNode.getNode(centerX, currentRow + 1, nodes);
            var newRoute = new WorldMapRoute(currentNode, targetNode);
            currentNode.addRoute(newRoute);
            
            Utils.log("createNextRoutes runned");
            return nodes;
        }
        
        //根据节点在本层的位置确定目标节点的x方向偏移量
        var xOffset;
        var min, max;
        if(route.dstNode.x == 0){
            min = 0;
            max = 1;
        }
        else if(route.dstNode.x == currentRowSize - 1){
            min = -1;
            max = 0;
        }
        else{
            min = -1;
            max = 1;
        }
        xOffset = rd.nextInt(min, max + 1);
        var newNodeX = route.dstNode.x + xOffset;
        var newNodeY = route.dstNode.y + 1;
        var targetNode = WorldMapNode.getNode(newNodeX, newNodeY + 1, nodes);//选定目标点


        //根据节点的共同祖先优化路线
        var minAncestorGap = 3;
        var maxAncestorGap = 5;
        var parents = targetNode.getParents();
        if(parents.length != 0){
            for(var parent of parents){
                if(parent != currentNode){
                    var ancestor = WorldMapNode.getCommonAncestor(parent ,currentNode, maxAncestorGap);
                    if(ancestor != null){
                        var ancestorGap = newNodeY - ancestor.y;
                        if(ancestorGap < minAncestorGap){
                            if(targetNode.x > currentNode.x){
                                newNodeX = currentNode.x + rd.nextInt(-1, 1);
                                if(newNodeX < 0)
                                    newNodeX = 0;
                            }
                            else if(targetNode.x == currentNode.x){
                                newNodeX = currentNode.x + rd.nextInt(-1, 2);
                                if(newNodeX < 0)
                                    newNodeX = currentNode.x + 1;
                                else if(newNodeX > nodes[currentRow + 1].length)
                                    newNodeX = currentNode.x - 1;
                            }
                            else{
                                newNodeX = currentNode.x + rd.nextInt(0, 2);
                                if(newNodeX > nodes[currentRow + 1].length)
                                    newNodeX = currentNode.x;
                            }
                            targetNode = WorldMapNode.getNode(newNodeX, newNodeY + 1, nodes);
                        }
                    }
                }
            }
        }

        //保证路线不交叉
        if(currentNode.x != 0){
            var leftNode = WorldMapNode.getNode(currentNode.x - 1, currentNode.y, nodes);
            if(leftNode.hasRoute()){
                if(leftNode.rightRoute().dstNode.x > newNodeX){
                    newNodeX = newNodeX + 1;
                }
            }
        }
        if(currentNode.x < currentRowSize - 1){
            var rightNote = WorldMapNode.getNode(currentNode.x + 1, currentNode.y, nodes);
            if(rightNote.hasRoute()){
                if(rightNote.leftRoute().dstNode.x < newNodeX){
                    newNodeX = newNodeX - 1;
                }
            }            
        }

        //确定路线的目标节点
        targetNode = WorldMapNode.getNode(newNodeX, newNodeY, nodes);

        //获得新路线并添加相应点的属性
        var newRoute = new WorldMapRoute(currentNode, targetNode);
        currentNode.addRoute(newRoute);
        targetNode.addParente(currentNode);

        Utils.log("createNextRoutes runned");
        //继续生成路线
        return WorldMapGenerator.createNextRoutes(nodes, newRoute, rd);
    }

    //删除多余路线
    public static deleteRepeatRoutes(nodes:WorldMapNode[][]):WorldMapNode[][]{
        for(var row of nodes){
            for(var node of row){
                if(node.hasRoute()){
                    var preRoutes:WorldMapRoute[] = [];
                    var i = 0;
                    for(var route of node.routes){
                        for(var testRoute of preRoutes){
                            if(route.dstNode == testRoute.dstNode)
                                i++;
                            
                        }
                        if(i == 0)
                        preRoutes.push(route);
                    }
                    node.routes = preRoutes;
                }
            }
        }
        Utils.log("deleteRepeatRoutes runned");
        return nodes;
    }

}