// 提示确认视图
class TipConfirmView extends egret.DisplayObjectContainer {

    private aniFact:AnimationFactory;

    private bg;
    constructor(w:number, h:number) {
        super();
        this.width = w;
        this.height = h;

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.x = this.bg.y = 0;
        this.bg.width = this.width;
        this.bg.height = this.height;

        // yesno 选择
        this.createOkYesNoLayer();

        this.aniFact = new AnimationFactory();
    }
    
    clear() {
        var subLayers = [this.bg, this.okyesnoPanel];
        for (var sl of subLayers) {
            if (this.contains(sl))
                this.removeChild(sl);
        }
    }

    // tips 部分

    tip:egret.TextField;
    public addTip(str) {
        if (!this.tip)
            this.removeChild(this.tip);
        
        this.tip = ViewUtils.createTextField(30, 0x000000);
        this.tip.textFlow = (new egret.HtmlTextParser).parser(str);
        this.tip.width = this.width;
        this.addChild(this.tip);

        this.aniFact.createAni("fade", {
            obj: this.tip,
            fy: this.height / 2 - 150,
            ty: this.height / 2,
            fa: 0, ta:1
        }).then(() => {
        });
    }

    // yesno 部分

    private okyesnoPanel:egret.DisplayObjectContainer;
    private yesnoTitle:egret.TextField;
    private btnOk:egret.TextField;
    private btnYes:egret.TextField;
    private btnNo:egret.TextField;

    createOkYesNoLayer() {
        this.okyesnoPanel = new egret.DisplayObjectContainer();
        this.okyesnoPanel.x = this.okyesnoPanel.y = 0;
        this.okyesnoPanel.width = this.width;
        this.okyesnoPanel.height = this.height;

        this.yesnoTitle = new egret.TextField();
        this.yesnoTitle.x = this.yesnoTitle.y = 0;
        this.yesnoTitle.textAlign = egret.HorizontalAlign.CENTER;
        this.yesnoTitle.verticalAlign = egret.VerticalAlign.MIDDLE;
        this.yesnoTitle.textColor = 0x000000;
        this.yesnoTitle.size = 50;
        this.yesnoTitle.width = this.width;
        this.yesnoTitle.height = this.height / 2;
        this.okyesnoPanel.addChild(this.yesnoTitle);

        this.btnOk = ViewUtils.createTextField(30, 0x000000);
        this.btnYes = ViewUtils.createTextField(30, 0x000000);
        this.btnNo = ViewUtils.createTextField(30, 0x000000);

        this.btnOk.touchEnabled = true;
        this.btnYes.touchEnabled = true;
        this.btnNo.touchEnabled = true;
        this.btnOk.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onConfirmOk, this);
        this.btnYes.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onConfirmYes, this);
        this.btnNo.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onConfirmNo, this);
    }

    private confirmOkCallback;
    private confirmYesNoCallback;
    private confirmCancelCallback;
    public confirmOkYesNo(title:string, yesno:boolean, btnText):Promise<boolean> {
        this.clear();
        this.addChild(this.bg);
        this.yesnoTitle.text = title;
        this.addChild(this.okyesnoPanel);

        if (yesno) {
            this.btnYes.text = btnText.yes;
            this.btnNo.text = btnText.no;
            this.okyesnoPanel.addChild(this.btnYes);
            this.okyesnoPanel.addChild(this.btnNo);
        } else {
            this.btnOk.text = btnText.ok;
            this.okyesnoPanel.addChild(this.btnOk);
        }

        this.btnOk.x = this.width / 2 - this.btnOk.width / 2;
        this.btnOk.y = this.height / 2 + this.btnOk.height / 2;
        this.btnYes.x = this.width / 2 - this.btnYes.width * 1.5;
        this.btnYes.y = this.height / 2 + this.btnYes.height / 2;
        this.btnNo.x = this.width / 2 + this.btnNo.width / 2;
        this.btnNo.y = this.height / 2 + this.btnNo.height / 2;

        return new Promise<boolean>((resolve, reject) => {
            this.confirmOkCallback = resolve;
            this.confirmYesNoCallback = resolve;
            this.confirmCancelCallback = reject;
        });
    }

    onConfirmOk(evt:egret.TouchEvent) {
        this.okyesnoPanel.removeChild(this.btnOk);
        this.removeChild(this.okyesnoPanel);
        this.removeChild(this.bg);
        this.confirmOkCallback(true);
    }

    onConfirmYes(evt:egret.TouchEvent) {
        this.okyesnoPanel.removeChild(this.btnYes);
        this.removeChild(this.okyesnoPanel);
        this.removeChild(this.bg);
        this.confirmYesNoCallback(true);
    }

    onConfirmNo(evt:egret.TouchEvent) {
        this.okyesnoPanel.removeChild(this.btnNo);
        this.removeChild(this.okyesnoPanel);
        this.removeChild(this.bg);
        this.confirmYesNoCallback(false);
    }
}
