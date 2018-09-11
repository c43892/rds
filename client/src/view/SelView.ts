// 选择逻辑视图
class SelView extends egret.DisplayObjectContainer {    
    public constructor(w, h) {
        super();
        this.width = w;
        this.height = h;
    }

    nw;
    nh;
    grids:egret.Bitmap[][];
    public rebuild(nw, nh) {
        if (this.nw != nw || this.nh != nh) {
            this.removeChildren();
            this.nw = nw;
            this.nh = nh;
            this.grids = [];

            for (var i = 0; i < nw; i++) {
                this.grids[i] = [];
                for (var j = 0; j < nh; j++) {
                    var bmp = new egret.Bitmap();
                    bmp["gx"] = i;
                    bmp["gy"] = j;
                    this.addChild(bmp);
                    this.grids[i][j] = bmp;
                    bmp.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTouchGrid, this);
                }
            }
        }
    }

    private clickHandler;
    private getClickPs;

    // 选择一个格子，f 形如 function(x:number, y:number):Boolean 表示指定位置是否可选，返回值表示选中的位置
    // mapView 是下面中间对齐的，我们需要计算左上角
    public selGrid(gw:number, gh:number, offsetx:number, offsety:number, f):Promise<any> {
        for (var i = 0; i < this.nw; i++) {
            var x = offsetx + gw * i;
            for (var j = 0; j < this.nh; j++) {
                var y = offsety + gh * j;
                var selectable = f(i, j);
                var bmp = <egret.Bitmap>this.grids[i][j];
                bmp.x = x; bmp.y = y;
                bmp.width = gw; bmp.height = gh;
                ViewUtils.setTexName(bmp, selectable ? undefined : "translucent_png");
                bmp.touchEnabled = selectable;
            }
        }

        this.getClickPs = (bmp) => { return {x:bmp["gx"], y:bmp["gy"]}; };
        return new Promise<any>((resolve, _) => this.clickHandler = (ps) => resolve(ps));
    }

    public getGridByPos(x, y) {
        return this.grids[x][y];
    }

    // 点击
    onTouchGrid(evt:egret.TouchEvent) {
        var ps = undefined;
        if (evt.target != this)
            ps = this.getClickPs(evt.target);

        this.clickHandler(ps);
    }
}
