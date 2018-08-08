// 地图视图
class MapView extends egret.DisplayObjectContainer {
    private map:Map; // 对应地图数据
    private mgvs:GridView[][]; // 所有地图格子视图
    private mevs:ElemView[][]; // 所有元素视图

    public gsize = {w:0, h:0};
    public gw = 0;
    public gh = 0;

    public constructor(w:number, h:number) {
        super();
    }

    // 重建所有格子视图，一般在初始化或者地图大小发生变化时用
    private rebuildMapGridView(w:number, h:number) {
        this.removeChildren();

        this.gsize = {w: w, h: h};

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
        this.gw = this.width / this.map.size.w;
        this.gh = this.height / this.map.size.h;

        Utils.NDimentionArrayForeach(this.mgvs, (gv:GridView) => {
            gv.x = gv.gx * this.gw;
            gv.y = gv.gy * this.gh;
            gv.width = this.gw;
            gv.height = this.gh;
            gv.refresh();
        });

        Utils.NDimentionArrayForeach(this.mevs, (ev:ElemView) => {
            ev.x = ev.gx * this.gw;
            ev.y = ev.gy * this.gh;
            ev.width = this.gw;
            ev.height = this.gh;
            ev.refresh();
        });
    }

    // 清除所有地图显示元素
    public clear() {
        Utils.NDimentionArrayForeach(this.mgvs, (mgv) => mgv.clear());
        Utils.NDimentionArrayForeach(this.mevs, (mev) => mev.clear());
    }

    // 指定位置发生状态或元素变化
    public refreshAt(cx:number, cy:number, bigSize = undefined) {
        var poses = [];
        poses.push({x:cx, y:cy});
        var e = this.map.getElemAt(cx, cy);
        if (bigSize) {
            var esize = bigSize;
            for (var i = -1; i <= esize.w + 1; i++) {
                for (var j = -1; j <= esize.h + 1; j++) {
                    var x = cx + i;
                    var y = cy + j;
                    if (x < 0 || x >= this.map.size.w || y < 0 || y >= this.map.size.h)
                        continue;
                    else if (Utils.indexOf(poses, (pt) => pt.x == x && pt.y == y) < 0)
                        poses.push({x:x, y:y});
                }
            }
        } else {
            this.map.travel8Neighbours(cx, cy, (x, y, g) => {
                poses.push({x:x, y:y});
            });
        }

        for (var pt of poses) {
            this.mgvs[pt.x][pt.y].refresh();
            this.mevs[pt.x][pt.y].refresh();
        }
    }

    public getGridViewAt(x:number, y:number):GridView {
        return this.mgvs[x][y];
    }

    // 获取指定位置的显示元素
    public getElemViewAt(x:number, y:number):ElemView {
        return this.mevs[x][y];
    }

    // 获取所有满足条件的显示元素
    public getElemViews(f, includingCovered = false):ElemView[] {
        var evs = [];
        Utils.NDimentionArrayForeach(this.mevs, (ev:ElemView) => {
            if (!includingCovered && ev.getGrid().isCovered()) return;
            var e = ev.getElem();
            if (e && f(e))
                evs.push(ev);
        });

        return evs;
    }

    // 逻辑坐标变换为显示坐标
    public logicPos2ShowPos(gx:number, gy:number) {
        var gw = this.width / this.map.size.w;
        var gh = this.height / this.map.size.h;
        return {x:gx*gw, y:gy*gh};
    }
}
