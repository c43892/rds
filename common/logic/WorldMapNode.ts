//世界地图节点
class WorldMapNode{
    public x:number;//世界地图横坐标
    public y:number;//世界地图层数
    public routes:WorldMapRoute[];//该点通往上一层的路线
    public roomType:string;//该点房间类型
    public leftRoute = this.routes.sort(WorldMapNode.getLeftRoute)[0];//由该点出发最左边的路线
    public rightRoute = this.routes.sort(WorldMapNode.getRightRoute)[0];//由该点出发最右边的路线
    public parents:WorldMapRoute[];//由下层通往该点的其他点

    constructor(x:number, y:number){
        this.x = x;
        this.y = y;
    }

    public getParents(routes:WorldMapRoute[]):WorldMapNode[]{
        var rs:WorldMapNode[];
        for(var r of routes){
            if(r.dstNode == this)
            rs.push(r.strNode);
        }
        return rs;
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

}