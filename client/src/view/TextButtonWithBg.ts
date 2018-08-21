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

        this.refresh();
    }

    public onClicked;
    onClickBtn(evt:egret.TouchEvent) {
        if (this.onClicked)
            this.onClicked();
    }

    private refresh() {
        this.bg.x = this.bg.y = 0;
        this.bg.width = this.width;
        this.bg.height = this.height;

        this.textField.x = this.textField.y = 0;
        this.textField.width = this.width;
        this.textField.height = this.height;
        this.textField.text = this.txt;
    }
}
