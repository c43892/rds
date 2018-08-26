// 选择逻辑视图
class SelView extends egret.DisplayObjectContainer {
    public constructor(w, h) {
        super();
        this.width = w;
        this.height = h;
        
        this.touchEnabled = true;
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTouchGrid, this);
    }

    private clickHandler;
    private getClickPs;

    // N选一，f 是形如 f(c:string):boolean 表示某个指定的选项是否有效
    public sel1inN(title:string, choices:string[], f):Promise<any> {
        this.removeChildren();
        var cw = 100;
        var ch = 50; // 选项按钮的宽高
        var space = (this.width - (cw * choices.length)) / (choices.length + 1);
        var x = space;
        var y = (this.height - ch) / 2;
        // 标题
        var tt = ViewUtils.createTextField(50, 0x00ff00);
        tt.text = title;
        tt.width = this.width;
        tt.height = ch;
        tt.y = y - 100;
        this.addChild(tt);
        // 选项
        var btn2c = [];
        for (var i = 0; i < choices.length; i++) {
            var n = i;
            var c = choices[n];
            var btn = ViewUtils.createTextField(50, 0x00ff00);
            btn.text = c;
            btn.x = x;
            btn.y = y;
            btn.width = cw;
            btn.height = ch;
            x += (cw + space);
            btn.touchEnabled = true;
            btn["n"] = n;
            this.addChild(btn);
        }

        this.getClickPs = (btn) => choices[btn["n"]];
        return new Promise<any>((resolve, reject) => this.clickHandler = (ps) => resolve(ps));
    }

    // 选择一个格子，f 形如 function(x:number, y:number):Boolean 表示指定位置是否可选，返回值表示选中的位置
    public selGrid(gw:number, gh:number, w:number, h:number, offsetx:number, offsety:number, f):Promise<any> {
        this.removeChildren();
        for (var i = 0; i < w; i++) {
            var x = offsetx + gw * i;
            for (var j = 0; j < h; j++) {
                var y = offsety + gh * j;

                var selectable = f(i, j);
                var bmp = ViewUtils.createBitmapByName(selectable ? "selectable_png" : "unselectable_png");
                bmp.x = x; bmp.y = y;
                bmp.width = gw; bmp.height = gh;
                bmp["gx"] = i;
                bmp["gy"] = j;
                bmp.touchEnabled = selectable;
                this.addChild(bmp);
            }
        }

        this.getClickPs = (bmp) => { return {x:bmp["gx"], y:bmp["gy"]}; };
        return new Promise<any>((resolve, reject) => this.clickHandler = (ps) => resolve(ps));
    }

    // 清除所有地图显示元素
    public close() {
        this.removeChildren();
    }

    // 点击
    onTouchGrid(evt:egret.TouchEvent) {
        var ps = undefined;
        if (evt.target != this)
            ps = this.getClickPs(evt.target);

        this.close();
        this.clickHandler(ps);
    }
}
