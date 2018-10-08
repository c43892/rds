// 道具视图
class PropsView extends egret.DisplayObjectContainer {

    static ViewGridSize = 84; // 道具格子大小
    public static readonly ViewGridNum = 6; // 道具格子数
    public pvs:PropView[]; // 所有元素视图
    private disableCover:egret.Bitmap; // 禁用时候的蒙版

    public constructor() {
        super();

        this.disableCover = ViewUtils.createBitmapByName("translucent_png")
        this.disableCover.touchEnabled = true;
        this.disableCover.alpha = 0.75;

        this.pvs = [];
        for(var i = 0; i < PropsView.ViewGridNum; i++) {
            let pv = new PropView(PropsView.ViewGridSize, PropsView.ViewGridSize);
            this.addChild(pv);
            this.pvs.push(pv);
            pv.touchEnabled = true;
        }
    }

    public getPropViewByIndex(n) {
        return this.pvs[n];
    }

    public setEnabled(enabled:boolean) {
        if (!enabled && !this.contains(this.disableCover)) {
            this.disableCover.x = this.disableCover.y = 0;
            this.disableCover.width = this.width;
            this.disableCover.height = this.height;
            this.addChild(this.disableCover);
        }
        else if (enabled && this.contains(this.disableCover))
            this.removeChild(this.disableCover);
    }

    // 刷新显示
    public refresh(es:Elem[]) {
        var x = 0;
        var xGap = (this.width - PropsView.ViewGridSize * PropsView.ViewGridNum) / (PropsView.ViewGridNum - 1);
        var dx = xGap + PropsView.ViewGridSize;
        var y = (this.height - PropsView.ViewGridSize) / 2;

        for (var i = 0; i < this.pvs.length; i++) {
            var pv = this.pvs[i];
            
            pv.x = x;
            x += dx;
            pv.y = y;

            var e = i < es.length ? es[i] : undefined;
            pv.setElem(e);
            pv.refresh();
        }
    }

    // 清除所有地图显示元素
    public clear() {
        Utils.NDimentionArrayForeach(this.pvs, (pv:PropView) => pv.clear());
    }
}
