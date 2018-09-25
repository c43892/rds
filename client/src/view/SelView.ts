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
    gridsAni:egret.MovieClip[][];
    public rebuild(nw, nh) {
        if (this.nw != nw || this.nh != nh) {
            this.removeChildren();
            this.nw = nw;
            this.nh = nh;
            this.grids = [];
            this.gridsAni = [];

            for (var i = 0; i < nw; i++) {
                this.grids[i] = [];
                this.gridsAni[i] = [];
                for (var j = 0; j < nh; j++) {
                    var bmp = new egret.Bitmap();
                    this.grids[i][j] = bmp;
                    bmp.alpha = 0;
                    this.addChild(bmp);
                    var ani = ViewUtils.createFrameAni("effGridSeletable");
                    this.gridsAni[i][j] = ani;
                    this.addChild(ani);
                    bmp.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTouchGrid, this);
                }
            }
        }
    }

    private clickHandler;

    // 选择一个格子，f 形如 function(x:number, y:number):Boolean 表示指定位置是否可选，返回值表示选中的位置
    // mapView 是下面中间对齐的，我们需要计算左上角
    public selGrid(gw:number, gh:number, offsetx:number, offsety:number, f, gvGetter, helper = {}):Promise<any> {
        for (var i = 0; i < this.nw; i++) {
            var x = offsetx + gw * i;
            for (var j = 0; j < this.nh; j++) {
                var y = offsety + gh * j;
                var selectable = f(i, j);
                var bmp = this.grids[i][j];
                bmp.x = x; bmp.y = y;
                bmp.width = gw; bmp.height = gh;
                // ViewUtils.setTexName(bmp, selectable ? undefined : "translucent_png");
                bmp.touchEnabled = true;
                bmp["gPos"] = selectable ? {x:i, y:j} : undefined;

                var ani = this.gridsAni[i][j];
                ani.x = x + gh / 2;
                ani.y = y + gw / 2;
                if (selectable) {
                    ani.alpha = 1;
                    ani.gotoAndPlay(0, -1);
                } else {
                    ani.alpha = 0;
                    ani.stop();
                }
            }
        }

        return new Promise<any>((r, _) => {
            helper["cancel"] = () => r(undefined);
            this.clickHandler = (ps) => r(ps);
        });
    }

    public getGridByPos(x, y) {
        return this.grids[x][y];
    }

    // 点击
    onTouchGrid(evt:egret.TouchEvent) {
        var ps = undefined;
        ps = evt.target["gPos"];
        this.clickHandler(ps);
    }
}
