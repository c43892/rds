// 地图视图
class MapView extends egret.DisplayObjectContainer {
    private map:Map; // 对应地图数据
    private mgvs:GridView[][]; // 所有地图格子视图
    private mevs:ElemView[][]; // 所有元素视图

    public constructor(w:number, h:number) {
        super();
    }

    // 重建所有格子视图，一般在初始化或者地图大小发生变化时用
    private rebuildMapGridView(w:number, h:number) {
        this.removeChildren();

        this.mgvs = [];
        for(var i = 0; i < w; i++) {
            this.mgvs[i] = [];
            for (var j = 0; j < h; j++) {
                let mgv = new GridView();
                mgv.gx = i;
                mgv.gy = j;
                this.addChild(mgv);
                this.mgvs[i].push(mgv);
                mgv.touchEnabled = false;
            }
        }

        this.mevs = [];
        for(var i = 0; i < w; i++) {
            this.mevs[i] = [];
            for (var j = 0; j < h; j++) {
                let mev = new ElemView();
                mev.gx = i;
                mev.gy = j;
                this.addChild(mev);
                this.mevs[i].push(mev);
                mev.touchEnabled = true;
            }
        }
    }

    // 设置新的地图数据，但并不自动刷新显示，需要手动刷新
    public setMap(map:Map) {
        if (this.map == undefined || map.size.w != this.map.size.w || map.size.h != this.map.size.h)
            this.rebuildMapGridView(map.size.w, map.size.h);

        this.map = map;
        Utils.NDimentionArrayForeach(this.mgvs, (mgv) => { mgv.map = map; });
        Utils.NDimentionArrayForeach(this.mevs, (mev) => { mev.map = map; });
    }

    // 刷新显示
    public refresh() {
        var gw = this.width / this.map.size.w;
        var gh = this.height / this.map.size.h;

        Utils.NDimentionArrayForeach(this.mgvs, (gv:GridView) => {
            gv.x = gv.gx * gw;
            gv.y = gv.gy * gh;
            gv.width = gw;
            gv.height = gh;
            gv.refresh();
        });

        Utils.NDimentionArrayForeach(this.mevs, (ev:ElemView) => {
            ev.x = ev.gx * gw;
            ev.y = ev.gy * gh;
            ev.width = gw;
            ev.height = gh;
            ev.refresh();
        });
    }

    // 清除所有地图显示元素
    public clear() {
        Utils.NDimentionArrayForeach(this.mgvs, (mgv) => mgv.clear());
        Utils.NDimentionArrayForeach(this.mevs, (mev) => mev.clear());
    }

    // 指定位置发生状态或元素变化
    public refresh3x3(cx:number, cy:number) {
        this.mgvs[cx][cy].refresh();
        this.mevs[cx][cy].refresh();
        this.map.travel8Neighbours(cx, cy, (x, y, e, g) => { this.mgvs[x][y].refresh(); this.mevs[x][y].refresh(); });
    }

    // 指定位置发生状态或元素变化
    public refreshAt(cx:number, cy:number) {
        this.mgvs[cx][cy].refresh();
        this.mevs[cx][cy].refresh();
    }

    // 获取指定位置的显示元素
    public getElemViewAt(x:number, y:number):ElemView {
        return this.mevs[x][y];
    }

    // 逻辑坐标变换为显示坐标
    public logicPos2ShowPos(gx:number, gy:number):number[] {
        var gw = this.width / this.map.size.w;
        var gh = this.height / this.map.size.h;
        return [gx * gw, gy * gh];
    }
}
