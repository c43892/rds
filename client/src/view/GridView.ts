
// 地图上的格子视图，负责处理未揭开时的显示内容
class GridView extends egret.DisplayObjectContainer {
    public map:Map;
    public gx:number;
    public gy:number;
    
    private gridBg:egret.Bitmap; // 格子地图
    private coveredImg:egret.Bitmap; // 被覆盖
    private uncoverableImg:egret.Bitmap; // 被覆盖，但可以揭开
    private blockedImg:egret.Bitmap; // 危险
    private coveredHazardNum:egret.TextField; // 数字

    public constructor() {
        super();

        this.gridBg = ViewUtils.createBitmapByName("grid_png"); // 底图
        this.coveredImg = ViewUtils.createBitmapByName("covered_png"); // 覆盖图
        this.blockedImg = ViewUtils.createBitmapByName("blocked_png"); // 危险
        this.uncoverableImg = ViewUtils.createBitmapByName("uncoverable_png"); // 覆盖图
        
        // 数字
        this.coveredHazardNum = new egret.TextField();
        this.coveredHazardNum.textColor = 0xffffff;
        this.coveredHazardNum.size = 50;
        this.coveredHazardNum.anchorOffsetX = 0;
        this.coveredHazardNum.anchorOffsetY = 0;
        this.coveredHazardNum.x = 0;
        this.coveredHazardNum.y = 0;
        this.coveredHazardNum.textAlign = egret.HorizontalAlign.CENTER;
        this.coveredHazardNum.verticalAlign = egret.VerticalAlign.MIDDLE;

        this.anchorOffsetX = 0;
        this.anchorOffsetY = 0;
    }

    public refresh() {
        this.clear();
        var b = this.map.getGridAt(this.gx, this.gy);
        var e = this.map.getElemAt(this.gx, this.gy);
        switch (b.status) {
            case GridStatus.Covered: // 被覆盖
                // 如果附近有怪物，或者四临没有揭开的格子，则不可揭开
                if (this.map.isUncoverable(b.pos.x, b.pos.y))
                    this.addChild(this.uncoverableImg);
                else
                    this.addChild(this.coveredImg);
            break;
            case GridStatus.Blocked: // 危险
                this.addChild(this.blockedImg);
            break;
            case GridStatus.Uncovered: // 被揭开
                var num = this.map.getCoveredHazardNum(this.gx, this.gy);
                if (num > 0) {
                    this.addChild(this.coveredHazardNum);
                    this.coveredHazardNum.text = num.toString();
                } else
                    this.addChild(this.gridBg);
            break;
        }

        var w = this.width;
        var h = this.height;
        var arr = [this.gridBg, this.blockedImg, this.coveredImg, this.uncoverableImg, this.coveredHazardNum];
        arr.forEach((a) => { a.x = 0; a.y = 0; a.width = w; a.height = h; });
    }

    public clear() {
        this.removeChildren();
    }
}
