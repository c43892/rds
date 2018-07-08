//世界地图节点
class WorldMapNode{
    public x:number;//世界地图横坐标
    public y:number;//世界地图层数
    public routes:WorldMapRoute[] = [];//该点通往上一层的路线
    public roomType:string;//该点房间类型
    public parents:WorldMapNode[] = [];//该点的父节点

    constructor(x:number, y:number){
        this.x = x;
        this.y = y;
    }


    public static getNode(x, y, nodes):WorldMapNode{
        var elem;
        Utils.NDimentionArrayForeach(nodes, (e) => {
            if (e.x == x && e.y == y) {
                elem = e;
                return true;
            }
        });
        return elem;
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
        return this.routes.sort(WorldMapNode.getRightRoute)[0];
    }

    public leftRoute():WorldMapRoute{//由该点出发最左边的路线
        return this.routes.sort(WorldMapNode.getLeftRoute)[0];
    }

    public static getLeftRoute = function (r1, r2){//找该点最左边路线的规则
        var dstX1 = r1.dstX;
        var dstX2 = r2.dstX;
        if(dstX1 < dstX2){
            return 1;
        }
        else if(dstX1 > dstX2){
            return -1;
        }
        else return 0;
    }

    public static getRightRoute = function (r1, r2){//找该点最右边路线的规则
        var dstX1 = r1.dstX;
        var dstX2 = r2.dstX;
        if(dstX1 < dstX2){
            return -1;
        }
        else if(dstX1 > dstX2){
            return 1;
        }
        else return 0;
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

    private static getMaxXNode(nodes:WorldMapNode[]):WorldMapNode{
        return nodes.sort(WorldMapNode.getLeftNode)[0];
    }

    private static getMinXNode(nodes:WorldMapNode[]):WorldMapNode{
        return nodes.sort(WorldMapNode.getRightNode)[0];
    }

}