// 带背景的文字按钮
class TextButtonWithBg extends egret.DisplayObjectContainer {
    public ft:egret.Bitmap; // 前景
    public bg:egret.Bitmap; // 背景
    public textField:egret.TextField;

    public constructor(bgTexName:string, fontSize:number = 0) {
        super();
        
        this.bg = ViewUtils.createBitmapByName(bgTexName);
        this.addChild(this.bg);
        this.width = this.bg.width;
        this.height = this.bg.height;

        if (fontSize > 0) {
            this.textField = ViewUtils.createTextField(fontSize, 0x000000);
            this.addChild(this.textField);
        }

        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClickBtn, this);
        this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onBtnDown, this);
        this.addEventListener(egret.TouchEvent.TOUCH_END, this.onBtnUp, this);
        this.addEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, this.onBtnUp, this);

        this.enabled = true;
        this.refresh();
    }

    public get textColor() {
        return this.textField ? this.textField.textColor : 0x000000;
    }

    public set textColor(color:number) {
        if (this.textField) this.textField.textColor = color;
    }

    public get textFlow() {
        return this.textField.textFlow;
    }

    public set textFlow(tf:egret.ITextElement[]) {
        this.textField.textFlow = tf;
    }

    txt:string;
    public get text() {
        return this.textField ? this.textField.text : undefined;
    }

    public set text(txt:string) {
        if (this.textField) this.textField.text = txt;
    }

    public setTexName(bgTexName:string) {
        ViewUtils.setTexName(this.bg, bgTexName);
    }

    // 设置悬浮效果的背景
    floatingBg:egret.Bitmap;
    floatingOffset:number = 0;
    public setFloatingEffectBg(bgTexName:string, floatingOffset:number) {
        if (this.floatingBg) this.removeChild(this.floatingBg);
        this.floatingBg = bgTexName ? ViewUtils.createBitmapByName(bgTexName) : undefined;
        this.floatingOffset = bgTexName ? floatingOffset : 0;
        if (this.floatingBg) this.addChild(this.floatingBg);
        this.refresh();
    }

    // 设置前景图片
    public setFrontImg(ftTexName:string) {
        if (this.ft) this.removeChild(this.ft);
        this.ft = ftTexName ? ViewUtils.createBitmapByName(ftTexName) : undefined;
        if (this.ft) this.addChild(this.ft);
        this.refresh();
    }

    static pressTimer:egret.Timer; // 长按计时
    static pressed:boolean = false; // 按钮被按下
    static longPressed:boolean = false; // 产生长按事件
    static readonly LongPressThreshold = 500; // 按下持续 0.5s 算长按
    public onPressed // 长按事件行为

    // 鼠标按下效果
    downBg:egret.Bitmap;
    public setDownBg(bgTexName:string) {
        if (this.downBg) this.removeChild(this.downBg);
        this.downBg = bgTexName ? ViewUtils.createBitmapByName(bgTexName) : undefined;
        if (this.downBg) this.downBg.alpha = 0;
        if (this.downBg) this.addChild(this.downBg);
        this.refresh();
    }

    // 不可用效果
    disabledBg:egret.Bitmap;
    public setDisableBg(bgTexName:string) {
        if (this.disabledBg) this.removeChild(this.disabledBg);
        this.disabledBg = bgTexName ? ViewUtils.createBitmapByName(bgTexName) : undefined;
        if (this.disabledBg) this.disabledBg.alpha = 0;
        if (this.disabledBg) this.addChild(this.disabledBg);
        this.refresh();
    }

    public get enabled() {
        return this.touchEnabled;
    }

    public set enabled(b:boolean) {
        this.touchEnabled = b;
        if (b) {
            this.bg.alpha = 1;
            if (this.disabledBg)
                this.disabledBg.alpha = 0;
            else
                ViewUtils.makeGray(this.bg, false);
        } else {
            if (this.disabledBg) {
                this.bg.alpha = 0;
                this.disabledBg.alpha = 1;
            } else {
                ViewUtils.makeGray(this.bg, true);
            }
        }
    }

    public onClicked;
    onClickBtn(evt:egret.TouchEvent) {
        if (this.onClicked)
            this.onClicked();
    }

    onDown = [];
    onBtnDown(evt:egret.TouchEvent) {
        var objs = [this.bg, this.downBg, this.disabledBg, this.ft, this.textField];
        objs.forEach((obj, _) => {
            if (obj) obj.y += this.floatingOffset;
        });

        if (this.downBg) {
            this.bg.alpha = 0;
            this.downBg.alpha = 1;
        }

        TextButtonWithBg.pressed = true;
        TextButtonWithBg.longPressed = false;

        if(this.onPressed){
            if (!TextButtonWithBg.pressTimer) {
                TextButtonWithBg.pressTimer = new egret.Timer(TextButtonWithBg.LongPressThreshold, 1);
                TextButtonWithBg.pressTimer.addEventListener(egret.TimerEvent.TIMER, this.onPressTimer, this);
            }

            TextButtonWithBg.pressTimer.start();
        }

        this.onDown.forEach((f, _) => f());
    }

    onPressTimer(evt:egret.TimerEvent) {
        TextButtonWithBg.pressTimer.removeEventListener(egret.TimerEvent.TIMER, this.onPressTimer, this);
        this.onPressed();
    }

    onUp = [];
    onBtnUp(evt:egret.TouchEvent) {        
        var objs = [this.bg, this.downBg, this.disabledBg, this.ft, this.textField];
        objs.forEach((obj, _) => {
            if (obj) obj.y -= this.floatingOffset;
        });

        this.bg.alpha = 1;
        if (this.downBg)
            this.downBg.alpha = 0;

        TextButtonWithBg.pressed = false;
        TextButtonWithBg.longPressed = false;
        if(TextButtonWithBg.pressTimer)
            TextButtonWithBg.pressTimer.stop();

        this.onUp.forEach((f, _) => f());
    }

    public textFieldOffset = {};
    public refresh() {
        var objs = [this.bg, this.downBg, this.disabledBg, this.ft, this.textField];
        objs.forEach((obj, i) => {
            if (obj) {
                obj.x = this.bg.y = 0;
                obj.width = this.width;
                obj.height = this.height;
                this.setChildIndex(obj, i);
            }
        });

        if (this.textField) {
            var txtOff = this.textFieldOffset ? this.textFieldOffset : {};
            var dl = this.textFieldOffset["l"] ? this.textFieldOffset["l"] : 0;
            var dt = this.textFieldOffset["t"] ? this.textFieldOffset["t"] : 0;
            var dr = this.textFieldOffset["r"] ? this.textFieldOffset["r"] : 0;
            var db = this.textFieldOffset["b"] ? this.textFieldOffset["b"] : 0;
            this.textField.x = dl;
            this.textField.y = dt;
            this.textField.width = this.width - dl - dr;
            this.textField.height = this.height - dt - db;
        }

        if (this.floatingBg) { // 下对齐
            this.floatingBg.y = this.bg.y + (this.bg.height - this.floatingBg.height);
            this.floatingBg.x = this.bg.x + (this.bg.width - this.floatingBg.width) / 2;
            this.setChildIndex(this.floatingBg, 0);

            objs.forEach((obj, _) => {
                if (obj) obj.y -= this.floatingOffset;
            });
        }
    }
}

// 专门用于底部的箭头按钮
class ArrowButton extends TextButtonWithBg{
    public constructor(toRight:boolean, bgTexName:string, fontSize:number = 0){
        super(bgTexName, fontSize);
        if (toRight)
            this.textFieldOffset = {t:-15, l:-5};
        else
            this.textFieldOffset = {t:-15, l:-5};

        this.refresh();
    }
}