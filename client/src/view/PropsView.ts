// 道具视图
class PropsView extends egret.DisplayObjectContainer {

    public static readonly ViewGridNum = 6; // 道具格子数
    static ViewGridSize = 84; // 道具格子大小

    public pvs:PropView[]; // 所有元素视图

    public constructor() {
        super();

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
