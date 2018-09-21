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

    //是否有路线通往下层
    public hasRoute():boolean{
        if(this.routes.length == 0)
            return false;        
        else 
            return true;
    }

    //获取该点的父节点
    public getParents(){
        return this.parents;
    }

    //添加父节点
    public addParent(parentNode:WorldMapNode){
        this.parents.push(parentNode);
    }

    //是否有父节点
    public hasParents(){
        return this.getParents().length > 0;
    }

    public isParent(node:WorldMapNode):boolean{
        if(Utils.indexOf(this.parents, (n:WorldMapNode) => n == node) < 0)
            return false;
        else return true;
    }

    // 获取该节点潜在的子节点
    public getPotentialChildrenNodes(nodes:WorldMapNode[][]){
        var pcn:WorldMapNode[] = [];
        for(var x = -1; x <= 1; x++)
            if(this.x + x > 0 && this.x + x < nodes[this.y].length)
                pcn.push(nodes[this.y + 1][this.x + x])
        return pcn;
    }

    //添加路线
    public addRoute(route:WorldMapRoute){
        this.routes.push(route);
    }

    //找该点出发的路线中最右边的路线
    public rightRoute():WorldMapRoute{
        return this.routes.sort(WorldMapNode.sortRoutesByX)[this.routes.length - 1];
    }

    //找该点出发的路线中最左边的路线
    public leftRoute():WorldMapRoute{
        return this.routes.sort(WorldMapNode.sortRoutesByX)[0];
    }

    //找该点出发的路线中最左边的路线的规则
    public static sortRoutesByX = function (r1:WorldMapRoute, r2:WorldMapRoute){
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

    //找较为靠左的节点的规则
    public static getLeftNode = function (n1, n2){
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

    //找较为靠右的节点的规则
    public static getRightNode = function (n1, n2){
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

    //找寻同层两点的共同祖先点
    public static getCommonAncestor(node1:WorldMapNode ,node2:WorldMapNode ,depth){
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

    //获取一个节点的兄弟节点
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

    //获取一个节点集内最右边的节点
    private static getMaxXNode(nodes:WorldMapNode[]):WorldMapNode{
        return nodes.sort(WorldMapNode.getLeftNode)[0];
    }

    //获取一个节点集内最左边的节点
    private static getMinXNode(nodes:WorldMapNode[]):WorldMapNode{
        return nodes.sort(WorldMapNode.getRightNode)[0];
    }

    //获得该点在随机抖动后的x坐标
    public static getNodeXposOnView(node:WorldMapNode, mapAreaLeftSize:number, xGap:number, swing:number):number{
        return node.x * xGap + mapAreaLeftSize + node.xOffsetOnView * xGap * swing;
    }

    //获得该点在随机抖动后的y坐标
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