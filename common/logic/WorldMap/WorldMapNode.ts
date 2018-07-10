//世界地图节点
class WorldMapNode{
    public x:number;//世界地图横坐标
    public y:number;//世界地图层数
    public routes:WorldMapRoute[] = [];//该点通往上一层的路线
    public roomType:string;//该点房间类型
    public parents:WorldMapNode[] = [];//该点的父节点
    public xOffsetOnView:number
    public yOffsetOnView:number

    constructor(x:number, y:number, xOffset:number, yOffset:number){
        this.x = x;
        this.y = y;
        this.xOffsetOnView = xOffset;
        this.yOffsetOnView = yOffset;
    }

    public static getNode(x, y, nodes):WorldMapNode{
        return nodes[y][x];
    }

    public hasRoute():boolean{//是否有路线通往下层
        if(this.routes.length == 0)
            return false;        
        else 
            return true;
    }

    public getParents(){//获取该点的父节点
        return this.parents;
    }

    public addParente(parentNode:WorldMapNode){//添加父节点
        this.parents.push(parentNode);
    }

    public addRoute(route:WorldMapRoute){//添加路线
        this.routes.push(route);
    }

    public rightRoute():WorldMapRoute{//由该点出发最右边的路线
        return this.routes.sort(WorldMapNode.sortRoutesByX)[this.routes.length - 1];
    }

    public leftRoute():WorldMapRoute{//由该点出发最左边的路线
        return this.routes.sort(WorldMapNode.sortRoutesByX)[0];
    }

    public static sortRoutesByX = function (r1:WorldMapRoute, r2:WorldMapRoute){//找该点最左边路线的规则
        var dstX1 = r1.dstNode.x;
        var dstX2 = r2.dstNode.x;
        if(dstX1 < dstX2){
            return -1;
        }
        else if(dstX1 > dstX2){
            return 1;
        }
        else {
            return 0;
        }
    }

    public static getLeftNode = function (n1, n2){//找该点最左边节点的规则
        var x1 = n1.x;
        var x2 = n2.x;
        if(x1 < x2){
            return 1;
        }
        else if(x1 > x2){
            return -1;
        }
        else return 0;
    }

    public static getRightNode = function (n1, n2){//找该点最左边节点的规则
        var x1 = n1.x;
        var x2 = n2.x;
        if(x1 < x2){
            return -1;
        }
        else if(x1 > x2){
            return 1;
        }
        else return 0;
    }

    public static getCommonAncestor(node1:WorldMapNode ,node2:WorldMapNode ,depth){//找寻同层两点的共同祖先点
        var rightNode:WorldMapNode;
        var leftNode:WorldMapNode;
    
        if (node1.x < node2.y){
            var leftNode = node1;
            rightNode = node2;
        } else{
            leftNode = node2;
            rightNode = node1;
        }
        var currentY = node1.y;

        while ((currentY >= 0) && (currentY >= node1.y - depth)){
            if(leftNode.getParents().length == 0 || rightNode.getParents().length == 0)
                return null;
            
            leftNode = WorldMapNode.getMaxXNode(leftNode.getParents());
            rightNode = WorldMapNode.getMinXNode(rightNode.getParents());
            if(leftNode == rightNode)
                return leftNode;
            
            currentY--;
        }
     return null;
    }

    public static getSiblingNodes(node:WorldMapNode):WorldMapNode[]{
        var siblingNodes = [];
        for(var i = 0; i < node.parents.length; i++){
            for(var j = 0; j < node.parents[i].routes.length; j++){
                if(node.parents[i].routes[j].dstNode != node){
                    siblingNodes.push(node.parents[i].routes[j].dstNode);
                }
            }
        }
        return siblingNodes;
    }

    private static getMaxXNode(nodes:WorldMapNode[]):WorldMapNode{
        return nodes.sort(WorldMapNode.getLeftNode)[0];
    }

    private static getMinXNode(nodes:WorldMapNode[]):WorldMapNode{
        return nodes.sort(WorldMapNode.getRightNode)[0];
    }

    public static getNodeXposOnView(node:WorldMapNode, mapAreaLeftSize:number, xGap:number, swing:number):number{
        return node.x * xGap + mapAreaLeftSize + node.xOffsetOnView * xGap * swing;
    }

    public static getNodeYposOnView(node:WorldMapNode, mapAreaHeight:number, yGap:number, swing:number):number{
        return mapAreaHeight - node.y * yGap - node.yOffsetOnView * yGap * swing;
    }

    public toString() {
        var nInfo = {
            x:this.x,
            y:this.y,
            roomType:this.roomType,
            xOffset:this.xOffsetOnView,
            yOffset:this.yOffsetOnView,
        };

        return JSON.stringify(nInfo);
    }

    public toStringForParents(){
            var parentsInfo = Utils.map(this.parents, (p) => { return {x:p.x, y:p.y}; });
            return JSON.stringify(parentsInfo);
    }

//     public static fromString(str):WorldMapNode{
//         var nInfo = JSON.parse(str);
//         var worldmapnode = new WorldMapNode(nInfo.x, nInfo.y, nInfo.xOffset, nInfo.yOffset);

//         worldmapnode.roomType = nInfo.roomType;
//         return worldmapnode;
//     }

// // 单独存节点的父节点信息
//     public static fromStringForParents(parentsInfo){
//         var pInfo = JSON.parse(parentsInfo);
//         return pInfo;
//     }

}