//世界地图路线
class WorldMapRoute{
     public strNode:WorldMapNode;//起始点
     public dstNode:WorldMapNode;//目标点
     public offsetX;
     public offsetY;

     constructor(strNode, dstNode){
         this.strNode = strNode;
         this.dstNode = dstNode;
         this.offsetX = dstNode.x - strNode.x;
         this.offsetY = 1
     }
}
