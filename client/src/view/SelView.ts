// 选择逻辑视图
class SelView extends egret.DisplayObjectContainer {    
    public constructor(w, h, bottom) {
        super();
        this.name = "SelView";
        this.width = w;
        this.height = h;

        // 额外上下两个描述信息
        this.descContainer = new egret.DisplayObjectContainer();
        this.descContainer.x = this.descContainer.y = 0;
        this.descContainer.width = w;
        this.descContainer.height = bottom;

        var bg = ViewUtils.createBitmapByName("selViewBg_png");
        bg.x = bg.y = 0;
        bg.width = this.descContainer.width;
        bg.height = this.descContainer.height;
        this.descContainer.addChild(bg);

        // 顶部描述
        this.descTop = ViewUtils.createTextField(20, 0xffffff);
        this.descTop.x = 0;
        this.descTop.width = this.descContainer.width;
        this.descTop.height = 20;
        this.descTop.y = 25;
        this.descContainer.addChild(this.descTop);

        // 底部描述
        this.descBottom = ViewUtils.createTextField(20, 0xffffff);
        this.descBottom.x = 0;
        this.descBottom.width = this.descContainer.width;
        this.descBottom.height = 20;
        this.descBottom.y = this.descContainer.height - this.descBottom.height - 25;
        this.descContainer.addChild(this.descBottom);
    }

    nw;
    nh;
    grids:egret.Bitmap[][];
    gridsAni:egret.MovieClip[][];
    descContainer:egret.DisplayObjectContainer; // 额外描述容器
    descTop:egret.TextField;
    descBottom:egret.TextField;
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
    public selGrid(gw:number, gh:number, offsetx:number, offsety:number, f, showSelectableEffect, p:Player, e:Elem, helper = {}):Promise<any> {
        for (var i = 0; i < this.nw; i++) {
            var x = offsetx + gw * i;
            for (var j = 0; j < this.nh; j++) {
                var y = offsety + gh * j;
                var selectable = f(i, j);
                var bmp = this.grids[i][j];
                bmp.x = x; bmp.y = y;
                bmp.width = gw; bmp.height = gh;
                bmp.touchEnabled = true;
                bmp["gPos"] = selectable ? {x:i, y:j} : undefined;

                // 可选效果
                var ani = this.gridsAni[i][j];
                ani.x = x + gh / 2;
                ani.y = y + gw / 2;
                if (selectable && showSelectableEffect) {
                    ani.alpha = 1;
                    ani.gotoAndPlay(0, -1);
                } else {
                    ani.alpha = 0;
                    ani.stop();
                }

                // 额外描述
                var descArr = ViewUtils.getElemNameAndDesc(e.type).useDescArr;
                this.addChild(this.descContainer);
                this.descTop.text = this.descBottom.text = "";
                if (descArr && descArr.length > 0) {
                    var topDesc =  ViewUtils.replaceByProperties(descArr[0], e, p);
                    this.descTop.textFlow = ViewUtils.fromHtml(topDesc);
                    if (descArr && descArr.length > 1) {
                        var descBottom =  ViewUtils.replaceByProperties(descArr[1], e, p);
                        this.descBottom.textFlow = ViewUtils.fromHtml(descBottom);
                    }
                }
            }
        }

        return new Promise<any>((r, _) => {
            helper["cancel"] = () => r(undefined);
            Utils.assert(!this.clickHandler, "SelView conflicted");
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
        this.clickHandler = undefined;
    }
}
