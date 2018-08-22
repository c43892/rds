// 带背景的文字按钮
class TextButtonWithBg extends egret.DisplayObjectContainer {
    public bg:egret.Bitmap;
    public textField:egret.TextField;

    txt:string;
    public get text() {
        return this.txt;
    }

    public set text(txt:string) {
        this.txt = txt;
        this.refresh();
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

    public constructor(fontSize:number, textColor:number, bgTexName:string) {
        super();
        this.bg = ViewUtils.createBitmapByName(bgTexName);
        this.width = this.bg.width;
        this.height = this.bg.height;
        this.textField = ViewUtils.createTextField(fontSize, textColor);
        this.addChild(this.bg);
        this.addChild(this.textField);

        this.touchEnabled = true;
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClickBtn, this);
        this.addEventListener(egret.TouchEvent.TOUCH_BEGIN, this.onBtnDown, this);
        this.addEventListener(egret.TouchEvent.TOUCH_END, this.onBtnUp, this);
        this.addEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, this.onBtnUp, this);

        this.refresh();
    }

    public onClicked;
    onClickBtn(evt:egret.TouchEvent) {
        if (this.onClicked)
            this.onClicked();
    }

    onBtnDown(evt:egret.TouchEvent) {
        this.bg.y += this.floatingOffset;
    }

    onBtnUp(evt:egret.TouchEvent) {
        this.bg.y -= this.floatingOffset;
    }

    private refresh() {
        this.bg.x = this.bg.y = 0;
        this.bg.width = this.width;
        this.bg.height = this.height;

        this.textField.x = this.textField.y = 0;
        this.textField.width = this.width;
        this.textField.height = this.height;
        this.textField.text = this.txt;

        if (this.floatingBg) { // 下对齐
            this.floatingBg.y = this.bg.y + (this.bg.height - this.floatingBg.height);
            this.floatingBg.x = this.bg.x + (this.bg.width - this.floatingBg.width) / 2;
            this.setChildIndex(this.floatingBg, 0);

            this.bg.y = -this.floatingOffset;
        }
    }
}
