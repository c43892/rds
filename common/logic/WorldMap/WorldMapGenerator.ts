//生成世界地图
class WorldMapGenerator{
    public static worldMapGenerator(w:WorldMap, rand:SRandom):WorldMap{
        var cfg = w.cfg;
        w.nodes = WorldMapGenerator.createNodes(w, cfg, rand);
        w.nodes = WorldMapGenerator.createRoutes(cfg, w.nodes, rand);
        w.nodes = WorldMapGenerator.deleteRepeatRoutes(w.nodes);
        w.nodes = WorldMapGenerator.arrangeRoomToAllNodes(w.nodes, cfg, rand);
        return w;
    }

    //根据地图大小生成所有节点
    public static createNodes(worldMap, cfg, rand:SRandom):WorldMapNode[][]{
        var nodes:WorldMapNode[][] = [];
        var height = cfg.totalLevels;
        var width = cfg.width;

        for(var y = 0; y < height + 1; y++){
            var row = [];
            for(var x = 0; x < width; x++){
                var xOffset = rand.nextInt(-100, 100) / 100;
                var yOffset = rand.nextInt(-100, 100) / 100;
                row.push(new WorldMapNode(x, y, xOffset, yOffset));
            }
            nodes[y] = row;
        }
        return nodes;
    }


    public static createRoutes(cfg, nodes:WorldMapNode[][], rd:SRandom){//生成第一段路线,由看不见的一层至玩家出发的第1层(程序为-1至0)
        var rowSize = cfg.width;

        for(var i = 0; i < cfg.routesMax; i++){
            var startNodeX = rd.nextInt(0, rowSize);

            if(i == 0)
            var firstStartX = startNodeX;//记下第一次的随机结果
            while(i == 1 && startNodeX == firstStartX){//重复随机,保证至少有两条不同的出发路线
                startNodeX = rd.nextInt(0, rowSize);
            }

            var startRoute = new WorldMapRoute(WorldMapNode.getNode(0, 0, nodes), WorldMapNode.getNode(startNodeX, 1, nodes));

            WorldMapNode.getNode(0, 0, nodes).addRoute(startRoute);
            WorldMapNode.getNode(startNodeX, 1, nodes).addParente(WorldMapNode.getNode(0, 0, nodes));
            
            WorldMapGenerator.createNextRoutes(nodes, startRoute, rd);//继续生成路线
        }
        return nodes;
    }

    public static createNextRoutes(nodes:WorldMapNode[][], route:WorldMapRoute, rd:SRandom){
        var currentNode = route.dstNode;//当前点
        var currentRow = currentNode.y;//当前层
        var currentRowSize = nodes[currentRow].length;//当前层节点数

        if(currentRow == nodes.length - 2){//判断是否是通往BOSS点的路线
            // var centerX = (currentRowSize + 1) / 2 - 1;
            // targetNode = WorldMapNode.getNode(centerX, currentRow + 1, nodes);
            targetNode = WorldMapNode.getNode(0, currentRow + 1, nodes);
            var newRoute = new WorldMapRoute(currentNode, targetNode);
            currentNode.addRoute(newRoute);
            targetNode.addParente(currentNode);
            
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
                                    newNodeX = currentNode.x + rd.nextInt(0, 2);
                                else if(newNodeX > nodes[currentRow + 1].length)
                                    newNodeX = currentNode.x + rd.nextInt(-1, 1);
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
                    newNodeX = currentNode.x;
                }
            }
        }
        if(currentNode.x < currentRowSize - 1){
            var rightNote = WorldMapNode.getNode(currentNode.x + 1, currentNode.y, nodes);
            if(rightNote.hasRoute()){
                if(rightNote.leftRoute().dstNode.x < newNodeX){
                    newNodeX = currentNode.x;
                }
            }            
        }

        //确定路线的目标节点
        targetNode = WorldMapNode.getNode(newNodeX, newNodeY, nodes);

        //获得新路线并添加相应点的属性
        var newRoute = new WorldMapRoute(currentNode, targetNode);
        currentNode.addRoute(newRoute);
        targetNode.addParente(currentNode);

        //继续生成路线
        return WorldMapGenerator.createNextRoutes(nodes, newRoute, rd);
    }

    //删除多余路线
    public static deleteRepeatRoutes(nodes:WorldMapNode[][]):WorldMapNode[][]{
       for(var i = 0; i < nodes.length; i++){
           for(var j = 0; j < nodes[i].length;  j++){
               if(nodes[i][j].hasRoute()){
                    var preRoutes:WorldMapRoute[] = [];
                    for(var k = 0; k < nodes[i][j].routes.length; k++){
                           var count = 0;
                           for(var l = 0; l < preRoutes.length; l++){
                               if(preRoutes[l].dstNode == nodes[i][j].routes[k].dstNode){
                                // Utils.log("delete a route from ", nodes[i][j].x, nodes[i][j].y, "to", preRoutes[l].dstNode.x, preRoutes[l].dstNode.y);
                                   count++;
                                }
                            }
                            if(count == 0){
                                preRoutes.push(nodes[i][j].routes[k]);
                            }
                       }
                //    Utils.log("node ", nodes[i][j].x, nodes[i][j].y, "routes count:" ,nodes[i][j].routes.length,"pure routes:",preRoutes.length);                   
                   nodes[i][j].routes = preRoutes;
                }   
            }
       }
        return nodes;
    }

    // //删除多余节点(暂时不用了)
    // public static deleteRedundantNodes(nodes:WorldMapNode[][], cfg):WorldMapNode[][]{
    //     var nodesSaved: WorldMapNode[][]=[];
    //     for(var row of nodes){
    //         var rowSaved = [];
    //         for(var node of row){
    //             if(node.hasRoute()){
    //                 rowSaved.push(node);
    //             }
    //         }
    //         nodesSaved.push(rowSaved);
    //     }
    //     nodesSaved.pop();
    //     nodesSaved.push([WorldMapNode.getNode((cfg.width + 1) / 2 - 1, cfg.totalLevels, nodes)]);//添加BOSS所在节点
    //     return nodesSaved;
    // }

    //给所有节点安排房间类型
    public static arrangeRoomToAllNodes(nodes:WorldMapNode[][], cfg, rd):WorldMapNode[][]{


        WorldMapGenerator.setRoomTypeToRow(nodes, 15, "boss");
        WorldMapGenerator.setRoomTypeToRow(nodes, 14, "camp");
        WorldMapGenerator.setRoomTypeToRow(nodes, 1, "normal");
        WorldMapGenerator.setRoomTypeToRow(nodes, 8, "box");

        var roomList = WorldMapGenerator.getRoomList(nodes, cfg);

        nodes = WorldMapGenerator.arrangeRoomToLeftNodes(nodes, roomList, rd);

        return nodes;

    }



    //获取待安排的房间列表
    public static getRoomList(nodes:WorldMapNode[][], cfg):string[]{
        var nodesCount = 0;
        for(var i = 1; i < nodes.length - 1; i++){
            for(var j = 0; j < nodes[i].length; j++){
                if(nodes[i][j].parents.length != 0 && nodes[i][j].roomType == null){
                    nodesCount ++;
                }
            }
        }

        var roomList = [];
        var shopCount = Math.round(cfg.specs.shop.percent * nodesCount / 100);
        for(var i = 0; i < shopCount; i++){
            roomList.push("shop");
        }
        var campCount = Math.round(cfg.specs.camp.percent * nodesCount / 100);
        for(var i = 0; i < campCount; i++){
            roomList.push("camp");
        }
        var seniorCount = Math.round(cfg.specs.senior.percent * nodesCount / 100);
        for(var i = 0; i < seniorCount; i++){
            roomList.push("senior");
        }
        var eventCount = Math.round(cfg.specs.event.percent * nodesCount / 100);
        for(var i = 0; i < eventCount; i++){
            roomList.push("event");
        }
        // Utils.log(shopCount, campCount, seniorCount, eventCount);

        if(roomList.length > nodesCount){
            Utils.log("too many special room were set.");
        }else if(roomList.length <= nodesCount){
            var lack = nodesCount - roomList.length;
            for(var i = 0; i < lack; i++){
                roomList.push("normal");
            }
        }
        // Utils.log("count", nodesCount, "length", roomList.length);
        
        return roomList;
    }

    //给一个节点设置房间类型
    public static setRoomType(node:WorldMapNode, type:string, roomList:string[]):string[]{
        node.roomType = type;
        return Utils.removeAt(roomList, Utils.indexOf(roomList, (e) => {if(e == type) return true;}));
    }

    //给一层节点设置房间类型
    public static setRoomTypeToRow(nodes:WorldMapNode[][], rowN:number, type:string){
        for(var i = 0; i < nodes[rowN].length; i++){
            nodes[rowN][i].roomType = type;
        }
    }

    //给非特定节点安排房间类型
    public static arrangeRoomToLeftNodes(nodes:WorldMapNode[][], roomList:string[], rd:SRandom):WorldMapNode[][]{
        for(var i = 1; i < nodes.length; i++){
            for(var j = 0; j < nodes[i].length; j++){
                if(nodes[i][j].parents.length != 0 && nodes[i][j].roomType == null){
                    var rt = WorldMapGenerator.getAvailableRoomType(nodes[i][j]);
                    if(rt != null){
                        var preTypes = Utils.filter(roomList, (e) => { if(Utils.contains(rt, e)) return true });
                        var type = preTypes[rd.nextInt(0, preTypes.length)];
                        if(!type)
                            type = "normal";

                        // Utils.log(nodes[i][j].x, nodes[i][j].y, "available rooms", rt, "roomlist", roomList, "preTypes", preTypes, "set", type);
                        roomList = WorldMapGenerator.setRoomType(nodes[i][j], type, roomList);
                        // Utils.log("lengthaf",roomList.length);
                    }else {
                        roomList = WorldMapGenerator.setRoomType(nodes[i][j], "normal", roomList);
                        Utils.log("cannot getAvailableRoomType at node", nodes[i][j].x, nodes[i][j].y, "rest rooms", roomList);
                    }                        
                }
            }
        }
        if(roomList.length != 0){
            Utils.log("these rooms were not be set", roomList);
        }        
        return nodes;
    }



    //根据规则寻找可用的房间类型列表
    public static getAvailableRoomType(node:WorldMapNode):string[]
    {
        var s = WorldMapGenerator.ruleBySibling(node);
        var p = WorldMapGenerator.ruleByParent(node);
        var c = WorldMapGenerator.ruleByChild(node);
        var types = Utils.filter(s, (e) => { if(Utils.contains(p, e))
                                            return true});
        types =  Utils.filter(types, (e) => { if(Utils.contains(c, e))
                                            return true});
        if(node.y > 12 || node.y < 6){
            types = Utils.removeAt(types, Utils.indexOf(types, (e) => {if(e == "senior") return true;}));
            types = Utils.removeAt(types, Utils.indexOf(types, (e) => {if(e == "camp") return true;}));            
        }
        // Utils.log(types);
        return types;
    }

    //节点房间类型不与父节点同时为商店,安全点或精英战斗
    public static ruleByParent(node:WorldMapNode):string[]{
        var preTypes = ["shop", "camp", "senior", "box"];
        for(var i = 0; i < node.parents.length; i++){
            preTypes = Utils.removeAt(preTypes, Utils.indexOf(preTypes, (e) => { if(e == node.parents[i].roomType) return true;}));
        }
        preTypes.push("normal");
        preTypes.push("event");
        return preTypes;
    }

    //节点房间类型与亲兄弟节点不同(具有相同父节点),可都为普通房间
    public static ruleBySibling(node:WorldMapNode):string[]{
        var preTypes = ["shop", "camp", "senior", "event"];
        for(var i = 0; i < WorldMapNode.getSiblingNodes(node).length; i++){
            var type = WorldMapNode.getSiblingNodes(node)[i].roomType;
            preTypes = Utils.removeAt(preTypes, Utils.indexOf(preTypes, (e) => { if(e == type) return true;}));
        }
        preTypes.push("normal");
        return preTypes;
    }

    public static ruleByChild(node:WorldMapNode):string[]{
        var preTypes = ["shop", "camp", "senior", "box"];
        for(var i = 0; i < node.routes.length; i++){
            preTypes = Utils.removeAt(preTypes, Utils.indexOf(preTypes, (e) => { if(e == node.routes[i].dstNode.roomType) return true;}));
        }
        preTypes.push("normal");
        preTypes.push("event");
        return preTypes;
    }

}