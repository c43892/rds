// 地图格子
class GridView extends egret.DisplayObjectContainer {
    public map:Map;
    public gx:number;
    public gy:number;
    
    private gridBg:egret.Bitmap; // 格子地图
    private coveredImg:egret.Bitmap; // 被覆盖
    private coveredHazardNum:egret.TextField; // 数字
    private elemImg:egret.Bitmap; // 元素图

    public constructor() {
        super();

        this.gridBg = ViewUtils.createBitmapByName("grid_png"); // 底图
        this.coveredImg = ViewUtils.createBitmapByName("covered_png"); // 覆盖图
        this.elemImg = ViewUtils.createBitmapByName(null); // 元素图

        // 数字
        this.coveredHazardNum = new egret.TextField();
        this.coveredHazardNum.textColor = 0xffffff;
        this.coveredHazardNum.size = 50;
        this.coveredHazardNum.anchorOffsetX = 0;
        this.coveredHazardNum.anchorOffsetY = 0;
        this.coveredHazardNum.x = 0;
        this.coveredHazardNum.y = 0;

        this.anchorOffsetX = 0;
        this.anchorOffsetY = 0;

        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTouchGrid, this);
        this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);
        this.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.onTouchMove, this);
        this.addEventListener(egret.TouchEvent.TOUCH_END, this.onTouchEnd, this);
    }

    public refresh() {
        this.clear();
        var b = this.map.getBrickAt(this.gx, this.gy);
        var e = this.map.getElemAt(this.gx, this.gy);
        switch (b.status) {
            case BrickStatus.Covered: // 被覆盖
                this.addChild(this.coveredImg);
            break;
            case BrickStatus.Uncovered: // 被揭开
                if (e) { // 有元素显示元素图片
                }
                else { // 空地块
                    var num = this.map.getCoveredHazardNum(this.gx, this.gy);
                    if (num > 0) {
                        this.addChild(this.coveredHazardNum);
                        this.coveredHazardNum.text = num.toString();
                    } else
                        this.addChild(this.gridBg);
                }
            break;
        }

        var w = this.width;
        var h = this.height;
        this.gridBg.width = w; this.gridBg.height = h;
        this.coveredImg.width = w; this.coveredImg.height = h;
        this.coveredHazardNum.width = w; this.coveredHazardNum.height = h;
        this.elemImg.width = w; this.elemImg.height = h;
    }

    public clear() {
        this.removeChildren();
    }

    public getElem():Elem {
        return this.map.getElemAt(this.gx, this.gy);
    }

    // 各种操作逻辑构建

    static dragging:boolean = false;
    static dragFrom:GridView;
    static draggingElemImg:egret.Bitmap; // 拖拽中的元素图

    public static try2UncoverAt; // 尝试解开指定位置
    public static try2UseElem; // 尝试无目标使用元素，会挂接形如 function(e:Elem) 的函数

    // 点击
    onTouchGrid(evt:egret.TouchEvent) {
        let b = this.map.getBrickAt(this.gx, this.gy);
        switch (b.status) {
            case BrickStatus.Covered:
                GridView.try2UncoverAt(b.pos.x, b.pos.y);
            break;
            case BrickStatus.Marked:
            case BrickStatus.Uncovered:
            {
                let e = this.map.getElemAt(this.gx, this.gy);
                if (e)
                    GridView.try2UseElem(e);
            }
        }
    }

    // 开始拖拽
    onTouchBegin(evt:egret.TouchEvent) {
        console.log("touch begin: " + this.gx + ", " + this.gy);
    }

    // 拖拽移动
    onTouchMove(evt:egret.TouchEvent) {
        console.log("touch move: " + this.gx + ", " + this.gy);
    }

    // 结束拖拽
    onTouchEnd(evt:egret.TouchEvent) {
        console.log("touch end: " + this.gx + ", " + this.gy);
    }
}
