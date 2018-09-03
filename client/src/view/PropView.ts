// 道具
class PropView extends egret.DisplayObjectContainer {
    private e:Elem;
    private bg:egret.Bitmap; // 底图
    private elemImg:egret.Bitmap; // 元素图
    private num:egret.TextField; // 数量，右下角

    public constructor(w, h) {
        super();
        this.width = w;
        this.height = h;

        // 底图
        this.bg = ViewUtils.createBitmapByName("skillGrid_png");
        this.bg.x = this.bg.y = 0;
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.addChild(this.bg);
        
        this.elemImg = new egret.Bitmap(); // 元素图
        this.elemImg.touchEnabled = true;
        this.elemImg.alpha = 0;
        this.elemImg.x = this.elemImg.y = 0;
        this.elemImg.width = w;
        this.elemImg.height = h;
        this.elemImg.name = "elemImg";
        this.addChild(this.elemImg);

        this.anchorOffsetX = 0;
        this.anchorOffsetY = 0;

        // 叠加数量
        this.num = ViewUtils.createTextField(25, 0xffffff);
        this.num.name = "num";
        this.num.anchorOffsetX = 0;
        this.num.anchorOffsetY = 0;
        this.num.x = 0;
        this.num.y = 0;
        this.addChild(this.num);

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
        ViewUtils.setTexName(this.elemImg, e.getElemImgRes() + "_png");
        this.elemImg.alpha = 1;

        if (e.attrs.canOverlap && e.cnt > 1) { // 可叠加元素显示数量
            this.num.text = e.cnt.toString();
            this.num.textColor = 0x00ff00;
            this.num.alpha = 1;
        }
    }

    public clear() {
        this.elemImg.alpha = 0;
        this.num.alpha = 0;
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
    public static confirmOkYesNo; // 确认选择

    static readonly LongPressThreshold = 500; // 按下持续 0.5s 算长按    
    static longPressed;
    static showElemDesc; // 显示元素信息
    static longPressPropView;
    static pressTimer:egret.Timer; // 长按计时

    // 点击
    async onTouchGrid(evt:egret.TouchEvent) {
        if (PropView.longPressed || !this.e)
            return;

        PropView.pressTimer.stop();

        if (this.e.canUse()){
            var content = ViewUtils.formatString(ViewUtils.getTipText("makeSureUseProp"), ViewUtils.getElemNameAndDesc(this.e.type).name);
            var ok = await PropView.confirmOkYesNo(undefined, content, true, ["确定", "取消"]);
            if (ok) PropView.try2UseProp(this.e);
        }
        else if (this.e.useWithTarget()) {
            var pos = await PropView.selectGrid((x, y) => this.e.canUseAt(x, y));
            if (pos) PropView.try2UsePropAt(this.e, pos.x, pos.y);
        }
    }

    // 按下
    onTouchBegin(evt:egret.TouchEvent) {
        if (!this.e)
            return;

        PropView.longPressed = false;
        if (!PropView.pressTimer) {
            PropView.pressTimer = new egret.Timer(PropView.LongPressThreshold, 1);
            PropView.pressTimer.addEventListener(egret.TimerEvent.TIMER, PropView.onPressTimer, this);
        }

        PropView.longPressPropView = this;
        PropView.pressTimer.start();
    }

    static async onPressTimer() {
        PropView.longPressed = true;
        PropView.pressTimer.stop();
        PropView.showElemDesc(PropView.longPressPropView.e);
    }
}
