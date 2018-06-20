// 地图上的元素视图
class ElemView extends egret.DisplayObjectContainer {
    public map:Map;
    public gx:number;
    public gy:number;

    private showLayer:egret.DisplayObjectContainer; // 装入所有显示内容
    private opLayer:egret.TextField; // 专门用于接收操作事件
    private elemImg:egret.Bitmap; // 元素图
    private num:egret.TextField; // 怪物血量或者元素数量

    public constructor() {
        super();
        this.elemImg = ViewUtils.createBitmapByName(); // 元素图
        this.showLayer = new egret.DisplayObjectContainer(); // 显示层
        this.addChild(this.showLayer);

        this.opLayer = new egret.TextField(); // 事件层
        this.addChild(this.opLayer);

        // 血量
        this.num = new egret.TextField();
        this.num.textColor = 0xffffff;
        this.num.size = 25;
        this.num.anchorOffsetX = 0;
        this.num.anchorOffsetY = 0;
        this.num.x = 0;
        this.num.y = 0;

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
            case GridStatus.Marked: // 被标记
            {
                Utils.assert(e && e instanceof Monster, "only monster could be marked");
                this.elemImg = ViewUtils.createBitmapByName(e.type + "_png");
                this.showLayer.addChild(this.elemImg);
                var colorMatrix = [
                    0.5,0,0,0,0,
                    0.5,0,0,0,0,
                    0.5,0,0,0,0,
                    1,0,0,0,0
                ];
                var colorFlilter = new egret.ColorMatrixFilter(colorMatrix);
                this.elemImg.filters = [colorFlilter];
            }
            break;
            case GridStatus.Uncovered: // 被揭开
                if (e) { // 有元素显示元素图片
                    this.elemImg = ViewUtils.createBitmapByName(e.type + "_png");
                    this.showLayer.addChild(this.elemImg);
                    this.elemImg.filters = undefined;
                    if (e instanceof Monster) { // 怪物
                        var m = <Monster>e;
                        this.num.text = m.hp.toString();
                        this.num.textColor = 0xff0000;
                        this.showLayer.addChild(this.num);
                    } else if (e.attrs.canOverlap && e.cnt > 1) { // 可叠加元素显示数量
                        this.num.text = e.cnt.toString();
                        this.num.textColor = 0x00ff00;
                        this.showLayer.addChild(this.num);
                    }
                }
            break;
        }

        var w = this.width;
        var h = this.height;
        var arr = [this.showLayer, this.opLayer, this.elemImg, this.num];
        arr.forEach((a) => { a.x = 0; a.y = 0; a.width = w; a.height = h; });
    }

    public clear() {
        this.showLayer.removeChildren();
    }

    public getElem():Elem {
        return this.map.getElemAt(this.gx, this.gy);
    }

    public getGrid():Grid {
        return this.map.getGridAt(this.gx, this.gy);
    }

    public getShowLayer():egret.DisplayObjectContainer {
        return this.showLayer;
    }

    public getImg():egret.Bitmap {
        return this.elemImg;
    }

    // 各种操作逻辑构建
    static dragStartThreshold2 = 25; // 拖动多远之后，认为已经开始拖拽
    static pressed:boolean = false; // 按下，但尚未开始拖拽移动
    static longPressed:boolean = false; // 是否产生了长按事件
    static dragging:boolean = false; // 开始拖拽，和 pressed 是互斥的
    static dragFrom:ElemView;
    static draggingElemImg:egret.Bitmap; // 拖拽中的元素图
    static pressTimer:egret.Timer; // 长按计时

    public static try2UseElem; // 尝试无目标使用元素，会挂接形如 function(e:Elem) 的函数
    public static try2UseElemAt; // 尝试使用一个元素，将坐标为目标
    public static selectGrid; // 选择目标
    public static select1InN; // n 选 1
    public static reposElemTo; // 将物品放到指定空位
    public static try2UncoverAt; // 尝试解开指定位置
    public static try2BlockGrid; // 尝试设置/取消一个危险标志

    // 点击
    onTouchGrid(evt:egret.TouchEvent) {
        if (ElemView.longPressed || ElemView.dragging)
            return;

        let b = this.map.getGridAt(this.gx, this.gy);
        switch (b.status) {
            case GridStatus.Covered:
                ElemView.try2UncoverAt(b.pos.x, b.pos.y);
            break;
            case GridStatus.Marked:
            case GridStatus.Uncovered:
            {
                let e = this.map.getElemAt(this.gx, this.gy);
                if (e) {
                    if (e.canUse()) {
                        if (e instanceof Prop || e instanceof Monster || e instanceof Relic)
                            ElemView.try2UseElem(e);
                        else
                            PropView.select1InN("确定使用 " + e.attrs.name, ["确定", "取消"], (c) => true, (c) => {
                                if (c == "确定")
                                    ElemView.try2UseElem(e);
                            });
                    }
                    else if (e.attrs.useWithTarget)
                        ElemView.selectGrid((x, y) => e.canUseAt(x, y), (pos) => {
                            if (!pos) return; // 取消选择
                            ElemView.try2UseElemAt(e, pos.x, pos.y);
                        });
                }
            }
        }
    }

    // 按下
    onTouchBegin(evt:egret.TouchEvent) {
        ElemView.pressed = true;
        ElemView.longPressed = false;
        ElemView.dragging = false;
        ElemView.dragFrom = this;

        if (!ElemView.pressTimer) {
            ElemView.pressTimer = new egret.Timer(1000, 1); // 持续 1s 算长按
            ElemView.pressTimer.addEventListener(egret.TimerEvent.TIMER, ElemView.onPressTimer, this);
        }

        ElemView.pressTimer.start();
    }

    static onPressTimer() {
        if (!ElemView.pressed)
            return;

        ElemView.longPressed = true;
        ElemView.pressTimer.stop();

        let b = ElemView.dragFrom.map.getGridAt(ElemView.dragFrom.gx, ElemView.dragFrom.gy);
        switch (b.status) {
            case GridStatus.Covered:
                ElemView.try2BlockGrid(b.pos.x, b.pos.y, true);
            break;
            case GridStatus.Blocked:
                ElemView.try2BlockGrid(b.pos.x, b.pos.y, false);
            break;
        }
    }

    // 拖拽移动
    onTouchMove(evt:egret.TouchEvent) {
        if (ElemView.longPressed)
            return;

        var px = evt.localX + this.x;
        var py = evt.localY + this.y;

        if (!ElemView.dragging && ElemView.dragFrom) {
            var e = ElemView.dragFrom.getElem();
            if (!e || !e.canBeMoved)
                return;

            var dx = ElemView.dragFrom.x - px;
            var dy = ElemView.dragFrom.y - py;
            if (dx * dx + dy * dy >= ElemView.dragStartThreshold2) {
                ElemView.pressed = false;
                ElemView.dragging = true;
                
                if (!ElemView.draggingElemImg) {
                    ElemView.draggingElemImg = new egret.Bitmap();
                    ElemView.draggingElemImg.width = ElemView.dragFrom.width;
                    ElemView.draggingElemImg.height = ElemView.dragFrom.height;
                }

                ElemView.draggingElemImg.texture = ElemView.dragFrom.elemImg.texture;                
                ElemView.draggingElemImg.x = px - ElemView.draggingElemImg.width / 2;
                ElemView.draggingElemImg.y = py - ElemView.draggingElemImg.height / 2;
                this.parent.addChild(ElemView.draggingElemImg);
                ElemView.dragFrom.elemImg.alpha = 0;
            }
        }
        else {
            ElemView.draggingElemImg.x = px - ElemView.draggingElemImg.width / 2;
            ElemView.draggingElemImg.y = py - ElemView.draggingElemImg.height / 2;
        }
    }

    // 结束拖拽
    onTouchEnd(evt:egret.TouchEvent) {
        if (ElemView.dragging) {
            ElemView.dragFrom.elemImg.x = 0;
            ElemView.dragFrom.elemImg.y = 0;
            ElemView.dragFrom.elemImg.alpha = 1;
            this.parent.removeChild(ElemView.draggingElemImg);
            ElemView.draggingElemImg.texture = undefined;

            var from = ElemView.dragFrom;
            var to = this;
            ElemView.reposElemTo(from.getElem(), to.gx, to.gy);
        }

        ElemView.pressed = false;
        ElemView.dragging = false;
        ElemView.dragFrom = undefined;
        ElemView.pressTimer.stop();
    }
}
