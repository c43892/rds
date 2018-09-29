// 道具
class PropView extends egret.DisplayObjectContainer {
    private e:Elem;
    private bg:egret.Bitmap; // 底图
    private bg2:egret.Bitmap; // 数字底
    private elemImg:egret.Bitmap; // 元素图
    private num:egret.TextField; // 数量，右下角
    private cd:egret.Bitmap; // cd,中心

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

        // 数字底
        this.bg2 = ViewUtils.createBitmapByName("skillGridBg2_png");
        this.bg2.x = this.width - this.bg2.width - 5;
        this.bg2.y = this.height - this.bg2.height - 5;
        this.addChild(this.bg2);

        // 叠加数量
        this.num = ViewUtils.createTextField(25, 0xffffff);
        this.num.name = "num";
        this.num.width = this.bg2.width * 2;
        this.num.textAlign = egret.HorizontalAlign.CENTER;
        this.num.height = this.bg2.height;
        this.num.verticalAlign = egret.VerticalAlign.MIDDLE;
        this.num.x = this.bg2.x - (this.num.width - this.bg2.width) / 2;
        this.num.y = this.bg2.y;
        this.addChild(this.num);

        // cd计数
        this.cd = new egret.Bitmap(); // cd 计数
        this.addChild(this.cd);

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
            this.num.alpha = 1;
            this.bg2.alpha = 1;
        }

        if (e.cd > 0) { // 显示 cd 计数
            ViewUtils.setTexName(this.cd, "cd" + e.cd + "_png", true);
            this.cd.x = (this.elemImg.width - this.cd.width) / 2;
            this.cd.y = (this.elemImg.height - this.cd.height) / 2;
            this.cd.alpha = 1;
        } else 
            this.cd.alpha = 0;
    }

    public clear() {
        this.elemImg.alpha = 0;
        this.num.alpha = 0;
        this.bg2.alpha = 0;
        this.cd.alpha = 0;
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

    setEffect(effName = undefined) {
        this.elemImg.scaleX = 1;
        this.elemImg.scaleY = 1;
        this.elemImg.x = 0;
        this.elemImg.y = 0;
        ViewUtils.makeGray(this.elemImg, false);

        switch (effName) {
            case "selected":
                this.elemImg.scaleX = 1.2;
                this.elemImg.scaleY = 1.2;
                this.elemImg.x = -this.elemImg.width * 0.1;
                this.elemImg.y = -this.elemImg.height * 0.1;
            break;
            case "invalid":
                ViewUtils.makeGray(this.elemImg, true);
            break;
            default:
            break;
        }
    }

    // 点击
    static currentSelPropView;
    static selHelper = {};
    async onTouchGrid(evt:egret.TouchEvent) {
        if (PropView.longPressed)
            return;

        PropView.pressTimer.stop();

        if (!this.e)
            return;

        // 有当前选中的，则先取消
        if (PropView.currentSelPropView) {
            PropView.currentSelPropView.setEffect();
            PropView.selHelper["cancel"]();
            return;
        }

        if (!this.e.isValid())
            return;
        else {            
            if (this.e.canUse()) {
                var content = ViewUtils.formatString(ViewUtils.getTipText("makeSureUseProp"), ViewUtils.getElemNameAndDesc(this.e.type).name);
                var ok = await PropView.confirmOkYesNo(undefined, content, true, ["确定", "取消"]);
                if (ok)
                    PropView.try2UseProp(this.e);
            }
            else if (this.e.useWithTarget()) {
                PropView.currentSelPropView = this;
                this.setEffect("selected");
                var pos = await PropView.selectGrid((x, y) => this.e.canUseAt(x, y), PropView.selHelper);
                if (pos)
                    PropView.try2UsePropAt(this.e, pos.x, pos.y);

                this.setEffect(!this.e.isValid() ? "invalid" : undefined);
                PropView.currentSelPropView = undefined;
            }
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
