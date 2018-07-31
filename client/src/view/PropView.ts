// 道具
class PropView extends egret.DisplayObjectContainer {
    private e:Elem;
    private elemImg:egret.Bitmap; // 元素图
    private num:egret.TextField; // 数量，右下角

    public constructor() {
        super();        
        this.elemImg = ViewUtils.createBitmapByName(); // 元素图
        this.elemImg.touchEnabled = true;

        this.anchorOffsetX = 0;
        this.anchorOffsetY = 0;

        // 叠加数量
        this.num = new egret.TextField();
        this.num.name = "num";
        this.num.textColor = 0xffffff;
        this.num.size = 25;
        this.num.anchorOffsetX = 0;
        this.num.anchorOffsetY = 0;
        this.num.x = 0;
        this.num.y = 0;

        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTouchGrid, this);
        this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onTouchBegin, this);
    }

    public setElem(e:Elem) {
        this.e = e;
    }

    public refresh() {
        this.clear();
        if (!this.e) return;

        var e = this.e;
        this.elemImg = ViewUtils.createBitmapByName(e.getElemImgRes() + "_png");
        this.elemImg.name = "elemImg";
        var w = this.width;
        var h = this.height;
        this.elemImg.x = this.elemImg.y = 0;
        this.elemImg.width = this.width;
        this.elemImg.height = this.height;
        this.addChild(this.elemImg);

        if (e.attrs.canOverlap && e.cnt > 1) { // 可叠加元素显示数量
            this.num.text = e.cnt.toString();
            this.num.textColor = 0x00ff00;
            this.addChild(this.num);
        }
    }

    public clear() {
        if (this.getChildByName(this.elemImg.name))
            this.removeChild(this.elemImg);

        if (this.getChildByName(this.num.name))
            this.removeChild(this.num);
    }

    public getElem():Elem {
        return this.e;
    }

    public getImg():egret.Bitmap {
        return this.elemImg;
    }

    // 各种操作逻辑构建
    public static try2UseProp; // 尝试无目标使用道具，会挂接形如 function(e:Elem) 的函数
    public static try2UsePropAt; // 尝试使用一个道具，将坐标为目标
    public static selectGrid; // 选择目标
    public static select1InN; // n 选 1

    static readonly LongPressThreshold = 500; // 按下持续 0.5s 算长按    
    static longPressed;
    static showElemDesc; // 显示元素信息
    static longPressPropView;
    static pressTimer:egret.Timer; // 长按计时

    // 点击
    onTouchGrid(evt:egret.TouchEvent) {
        if (PropView.longPressed)
            return;

        PropView.pressTimer.stop();

        if (this.e.canUse())
            PropView.select1InN("确定使用 " + ViewUtils.getElemNameAndDesc(this.e.type).name, ["确定", "取消"], (c) => true, (c) => {
                if (c == "确定")
                    PropView.try2UseProp(this.e);
            });
        else if (this.e.attrs.useWithTarget) {
            PropView.selectGrid((x, y) => this.e.canUseAt(x, y), (pos) => {
                if (!pos) return; // 取消选择
                PropView.try2UsePropAt(this.e, pos.x, pos.y);
            });
        }
    }

    // 按下
    onTouchBegin(evt:egret.TouchEvent) {
        PropView.longPressed = false;
        if (!PropView.pressTimer) {
            PropView.pressTimer = new egret.Timer(PropView.LongPressThreshold, 1);
            PropView.pressTimer.addEventListener(egret.TimerEvent.TIMER, PropView.onPressTimer, this);
        }

        PropView.longPressPropView = evt.target;
        PropView.pressTimer.start();
    }

    static async onPressTimer() {
        PropView.longPressed = true;
        PropView.pressTimer.stop();
        PropView.showElemDesc(PropView.longPressPropView.e);
    }
}
