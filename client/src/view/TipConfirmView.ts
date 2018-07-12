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
        this.createYesNoLayer();
    }
    
    clear() {
        var subLayers = [this.bg, this.tipsPanel, this.yesnoPanel];
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

    private yesnoPanel:egret.DisplayObjectContainer;
    private yesnoTitle:egret.TextField;
    private btnYes:egret.Bitmap;
    private btnNo:egret.Bitmap;

    createYesNoLayer() {
        this.yesnoPanel = new egret.DisplayObjectContainer();
        this.yesnoPanel.x = this.yesnoPanel.y = 0;
        this.yesnoPanel.width = this.width;
        this.yesnoPanel.height = this.height;

        this.yesnoTitle = new egret.TextField();
        this.yesnoTitle.x = this.yesnoTitle.y = 0;
        this.yesnoTitle.textAlign = egret.HorizontalAlign.CENTER;
        this.yesnoTitle.verticalAlign = egret.VerticalAlign.MIDDLE;
        this.yesnoTitle.textColor = 0x000000;
        this.yesnoTitle.size = 50;
        this.yesnoTitle.width = this.width;
        this.yesnoTitle.height = this.height / 2;
        this.yesnoPanel.addChild(this.yesnoTitle);

        this.btnYes = ViewUtils.createBitmapByName("btnyes_png");
        this.btnYes.x = this.width / 2 - this.btnYes.width * 1.5;
        this.btnYes.y = this.height / 2 + this.btnYes.height / 2;
        this.btnNo = ViewUtils.createBitmapByName("btnno_png");
        this.btnNo.x = this.width / 2 + this.btnNo.width / 2;
        this.btnNo.y = this.height / 2 + this.btnNo.height / 2;
        this.yesnoPanel.addChild(this.btnYes);
        this.yesnoPanel.addChild(this.btnNo);

        this.btnYes.touchEnabled = true;
        this.btnNo.touchEnabled = true;
        this.btnYes.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onConfirmYes, this);
        this.btnNo.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onConfirmNo, this);
    }

    private confirmYesNoCallback;
    private confirmCancelCallback;
    public confirmYesNo(title:string):Promise<boolean> {
        this.clear();
        this.addChild(this.bg);
        this.yesnoTitle.text = title;
        this.addChild(this.yesnoPanel);
        return new Promise<boolean>((resolve, reject) => {
            this.confirmYesNoCallback = resolve;
            this.confirmCancelCallback = reject;
        });
    }

    onConfirmYes(evt:egret.TouchEvent) {
        this.removeChild(this.yesnoPanel);
        this.removeChild(this.bg);
        this.confirmYesNoCallback(true);
    }

    onConfirmNo(evt:egret.TouchEvent) {
        this.removeChild(this.yesnoPanel);
        this.removeChild(this.bg);
        this.confirmYesNoCallback(false);
    }
}
