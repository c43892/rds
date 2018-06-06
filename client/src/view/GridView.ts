// 地图格子
class GridView extends egret.DisplayObjectContainer {
    public map:Map;
    public gx:number;
    public gy:number;
    
    private gridBg:egret.Bitmap; // 格子地图
    private coveredImg:egret.Bitmap; // 被覆盖
    private uncoverableImg:egret.Bitmap; // 被覆盖，但可以揭开
    private blockedImg:egret.Bitmap; // 危险
    private coveredHazardNum:egret.TextField; // 数字
    private elemImg:egret.Bitmap; // 元素图
    private hpNum:egret.TextField; // 怪物血量

    public constructor() {
        super();

        this.gridBg = ViewUtils.createBitmapByName("grid_png"); // 底图
        this.coveredImg = ViewUtils.createBitmapByName("covered_png"); // 覆盖图
        this.uncoverableImg = ViewUtils.createBitmapByName("uncoverable_png"); // 覆盖图
        this.elemImg = ViewUtils.createBitmapByName(); // 元素图
        this.blockedImg = ViewUtils.createBitmapByName("blocked_png"); // 危险
        

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

        // 血量
        this.hpNum = new egret.TextField();
        this.hpNum.textColor = 0xffffff;
        this.hpNum.size = 25;
        this.hpNum.anchorOffsetX = 0;
        this.hpNum.anchorOffsetY = 0;
        this.hpNum.x = 0;
        this.hpNum.y = 0;

        this.anchorOffsetX = 0;
        this.anchorOffsetY = 0;

        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTouchGrid, this);
        this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);
        this.addEventListener(egret.TouchEvent.TOUCH_MOVE, this.onTouchMove, this);
        this.addEventListener(egret.TouchEvent.TOUCH_END, this.onTouchEnd, this);
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
                if (e) { // 有元素显示元素图片
                    this.elemImg = ViewUtils.createBitmapByName(e.type + "_png");
                    this.addChild(this.elemImg);
                    if (e instanceof Monster) {
                        var m = <Monster>e;
                        this.hpNum.text = m.hp.toString();
                        this.addChild(this.hpNum);
                    }
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
        var arr = [this.gridBg, this.blockedImg, this.coveredImg, this.uncoverableImg, this.elemImg, this.coveredHazardNum];
        arr.forEach((a) => { a.width = w; a.height = h; });
    }

    public clear() {
        this.removeChildren();
    }

    public getElem():Elem {
        return this.map.getElemAt(this.gx, this.gy);
    }

    public getGrid():Grid {
        return this.map.getGridAt(this.gx, this.gy);
    }

    // 各种操作逻辑构建
    static dragStartThreshold2 = 25; // 拖动多远之后，认为已经开始拖拽
    static pressed:boolean = false; // 按下，但尚未开始拖拽移动
    static longPressed:boolean = false; // 是否产生了长按事件
    static dragging:boolean = false; // 开始拖拽，和 pressed 是互斥的
    static dragFrom:GridView;
    static draggingElemImg:egret.Bitmap; // 拖拽中的元素图
    static pressTimer:egret.Timer; // 长按计时

    public static try2UncoverAt; // 尝试解开指定位置
    public static try2UseElem; // 尝试无目标使用元素，会挂接形如 function(e:Elem) 的函数
    public static try2BlockGrid; // 尝试设置/取消一个危险标志
    public static try2UseAt; // 尝试对使用一个元素，将坐标为目标

    // 点击
    onTouchGrid(evt:egret.TouchEvent) {
        if (GridView.longPressed || GridView.dragging)
            return;

        let b = this.map.getGridAt(this.gx, this.gy);
        switch (b.status) {
            case GridStatus.Covered:
                GridView.try2UncoverAt(b.pos.x, b.pos.y);
            break;
            case GridStatus.Marked:
            case GridStatus.Uncovered:
            {
                let e = this.map.getElemAt(this.gx, this.gy);
                if (e)
                    GridView.try2UseElem(e);
            }
        }
    }

    // 按下
    onTouchBegin(evt:egret.TouchEvent) {
        GridView.pressed = true;
        GridView.longPressed = false;
        GridView.dragging = false;
        GridView.dragFrom = this;

        if (!GridView.pressTimer) {
            GridView.pressTimer = new egret.Timer(1000, 1); // 持续 1s 算长按
            GridView.pressTimer.addEventListener(egret.TimerEvent.TIMER, GridView.onPressTimer, this);
        }

        GridView.pressTimer.start();
    }

    static onPressTimer() {
        if (!GridView.pressed)
            return;

        GridView.longPressed = true;
        GridView.pressTimer.stop();

        let b = GridView.dragFrom.map.getGridAt(GridView.dragFrom.gx, GridView.dragFrom.gy);
        switch (b.status) {
            case GridStatus.Covered:
                GridView.try2BlockGrid(b.pos.x, b.pos.y, true);
            break;
            case GridStatus.Blocked:
                GridView.try2BlockGrid(b.pos.x, b.pos.y, false);
            break;
        }
    }

    // 拖拽移动
    onTouchMove(evt:egret.TouchEvent) {
        if (GridView.longPressed)
            return;

        var px = evt.localX + this.x;
        var py = evt.localY + this.y;

        if (!GridView.dragging) {
            var e = GridView.dragFrom.getElem();
            if (!e || !e.canBeMoved)
                return;

            var dx = GridView.dragFrom.x - px;
            var dy = GridView.dragFrom.y - py;
            if (dx * dx + dy * dy >= GridView.dragStartThreshold2) {
                GridView.pressed = false;
                GridView.dragging = true;
                
                if (!GridView.draggingElemImg) {
                    GridView.draggingElemImg = new egret.Bitmap();
                    GridView.draggingElemImg.width = GridView.dragFrom.width;
                    GridView.draggingElemImg.height = GridView.dragFrom.height;
                }

                GridView.draggingElemImg.texture = GridView.dragFrom.elemImg.texture;                
                GridView.draggingElemImg.x = px - GridView.draggingElemImg.width / 2;
                GridView.draggingElemImg.y = py - GridView.draggingElemImg.height / 2;
                this.parent.addChild(GridView.draggingElemImg);
                GridView.dragFrom.elemImg.alpha = 0;
            }
        }
        else {
            GridView.draggingElemImg.x = px - GridView.draggingElemImg.width / 2;
            GridView.draggingElemImg.y = py - GridView.draggingElemImg.height / 2;
        }
    }

    // 结束拖拽
    onTouchEnd(evt:egret.TouchEvent) {
        if (GridView.dragging) {
            GridView.dragFrom.elemImg.x = 0;
            GridView.dragFrom.elemImg.y = 0;
            GridView.dragFrom.elemImg.alpha = 1;
            this.parent.removeChild(GridView.draggingElemImg);
            GridView.draggingElemImg.texture = undefined;

            var from = GridView.dragFrom;
            var to = this;
            GridView.try2UseAt(from.getElem(), to.gx, to.gy);
        }

        GridView.pressed = false;
        GridView.dragging = false;
        GridView.dragFrom = undefined;
        GridView.pressTimer.stop();
    }
}
