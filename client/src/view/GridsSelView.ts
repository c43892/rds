// 处理目标选择时的视图
class GridsSelView extends egret.DisplayObjectContainer {
    public constructor() {
        super();
        this.touchEnabled = true;
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTouchGrid, this);
    }

    // 打开选择界面，f 形如 function(x:number, y:number):Boolean 表示指定位置是否可选，返回值表示选中的位置
    private clickHandler;
    public open(gw:number, gh:number, w:number, h:number, offsetx:number, offsety:number, f):Promise<any> {
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

        return new Promise<any>((resolve, reject) => this.clickHandler = (pos) => resolve(pos));
    }

    // 清除所有地图显示元素
    public close() {
        this.removeChildren();
    }

    // 点击
    onTouchGrid(evt:egret.TouchEvent) {
        var pos = undefined;
        if (evt.target != this)
            pos = {x:evt.target["gx"], y:evt.target["gy"]};

        this.close();
        this.clickHandler(pos);
    }
}
