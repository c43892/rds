// 提示确认视图
class TipConfirmView extends egret.DisplayObjectContainer {

    private bg;
    constructor(w:number, h:number) {
        super();
        this.width = w;
        this.height = h;

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.x = this.bg.y = 0;
        this.bg.width = this.width;
        this.bg.height = this.height;

        // 提示信息
        this.createTipsLayer();

        // yesno 选择
        this.createOkYesNoLayer();
    }
    
    clear() {
        var subLayers = [this.bg, this.tipsPanel, this.okyesnoPanel];
        for (var sl of subLayers) {
            if (this.contains(sl))
                this.removeChild(sl);
        }
    }

    // tips 部分

    private tipsPanel;

    createTipsLayer() {
        this.tipsPanel = new egret.DisplayObjectContainer();
        this.tipsPanel.x = this.tipsPanel.y = 0;
        this.tipsPanel.width = this.width;
        this.tipsPanel.heigh = this.height;
    }

    // yesno 部分

    private okyesnoPanel:egret.DisplayObjectContainer;
    private yesnoTitle:egret.TextField;
    private btnOk:egret.Bitmap;
    private btnYes:egret.Bitmap;
    private btnNo:egret.Bitmap;

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

        this.btnOk = ViewUtils.createBitmapByName("btnok_png");
        this.btnOk.x = this.width / 2 - this.btnOk.width / 2;
        this.btnOk.y = this.height / 2 + this.btnOk.height / 2;
        this.btnYes = ViewUtils.createBitmapByName("btnyes_png");
        this.btnYes.x = this.width / 2 - this.btnYes.width * 1.5;
        this.btnYes.y = this.height / 2 + this.btnYes.height / 2;
        this.btnNo = ViewUtils.createBitmapByName("btnno_png");
        this.btnNo.x = this.width / 2 + this.btnNo.width / 2;
        this.btnNo.y = this.height / 2 + this.btnNo.height / 2;        

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
    public confirmOkYesNo(title:string, yesno:boolean):Promise<boolean> {
        this.clear();
        this.addChild(this.bg);
        this.yesnoTitle.text = title;
        this.addChild(this.okyesnoPanel);

        if (yesno) {
            this.okyesnoPanel.addChild(this.btnYes);
            this.okyesnoPanel.addChild(this.btnNo);
        } else
            this.okyesnoPanel.addChild(this.btnOk);

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
