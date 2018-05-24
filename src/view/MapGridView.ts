// 地图格子
class MapGridView extends egret.DisplayObjectContainer {
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
}
