// 提示确认视图
class TipConfirmView extends egret.DisplayObjectContainer {

    private aniFact:AnimationFactory;

    private bg:egret.Bitmap;
    constructor(w:number, h:number) {
        super();
        this.width = w;
        this.height = h;
        this.name = "tipConfirm";

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.x = this.bg.y = 0;
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.touchEnabled = true;
        this.bg.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onBg, this);

        // yesno 选择
        this.createOkYesNoLayer();

        this.aniFact = new AnimationFactory();
        AniUtils.wait4clickImpl = async () => this.wait4clickAny();
    }
    
    clear() {
        var subLayers = [this.bg, this.okyesnoPanel];
        for (var sl of subLayers) {
            if (this.contains(sl))
                this.removeChild(sl);
        }
    }

    // 等待点击一下
    public wait4clickAny():Promise<void> {
        this.addChild(this.bg);
        return new Promise<void>((resolve, reject) => this.onBgClicked = () => {
            this.removeChild(this.bg);
            resolve();
        });
    }

    onBgClicked;
    onBg(evt:egret.TouchEvent) {
        if (this.onBgClicked)
            this.onBgClicked();
    }

    // tips 部分

    tip:egret.TextField;
    public addTip(str) {
        if (!this.tip)
            this.removeChild(this.tip);
        
        this.tip = ViewUtils.createTextField(30, 0x000000);
        this.tip.textFlow = ViewUtils.fromHtml(str);
        this.tip.width = this.width;
        this.addChild(this.tip);

        this.aniFact.createAni("tr", {
            obj: this.tip,
            fy: this.height / 2 - 150,
            ty: this.height / 2,
            fa: 0, ta:1
        }).then(() => {});
    }

    // yesno 部分

    private okyesnoPanel:egret.DisplayObjectContainer;
    private yesnoBg:egret.Bitmap;
    private yesnoTitle:egret.TextField;
    private yesnoContent:egret.TextField;
    private btnOk:TextButtonWithBg;
    private btnYes:TextButtonWithBg;
    private btnNo:TextButtonWithBg;
    private yesnoObjs:egret.DisplayObject[];

    createOkYesNoLayer() {
        this.okyesnoPanel = new egret.DisplayObjectContainer();
        this.okyesnoPanel.x = this.okyesnoPanel.y = 0;
        this.okyesnoPanel.width = this.width;
        this.okyesnoPanel.height = this.height;

        this.yesnoBg = ViewUtils.createBitmapByName("confirmBg_png");
        this.yesnoBg.name = "yesnoBg";

        this.yesnoTitle = ViewUtils.createTextField(30, 0xff0000);
        this.yesnoTitle.bold = true;
        this.yesnoTitle.name = "yesnoTitle";

        this.yesnoContent = ViewUtils.createTextField(25, 0x00000);
        this.yesnoContent.name = "yesnoContent";

        this.btnOk = new TextButtonWithBg("btnBg_png", 30); this.btnOk.name = "btnOk";
        this.btnYes = new TextButtonWithBg("btnBg_png", 30); this.btnYes.name = "btnYes";
        this.btnNo = new TextButtonWithBg("btnBg_png", 30); this.btnNo.name = "btnNo";

        this.yesnoObjs = [this.yesnoBg, this.yesnoTitle, this.yesnoContent, this.btnOk, this.btnYes, this.btnNo];
        this.yesnoObjs.forEach((obj, _) => this.okyesnoPanel.addChild(obj));
        ViewUtils.multiLang(this, ...this.yesnoObjs);

        this.btnOk.onClicked = () => this.onConfirmOk();
        this.btnYes.onClicked = () => this.onConfirmYes();
        this.btnNo.onClicked = () => this.onConfirmNo();
    }

    private confirmOkCallback;
    private confirmYesNoCallback;
    public confirmOkYesNo(title:string, content:string, yesno:boolean, btnText):Promise<boolean> {
        this.clear();
        this.addChild(this.bg);
        this.yesnoTitle.textFlow = title ? ViewUtils.fromHtml(title) : [];
        this.yesnoContent.textFlow = content ? ViewUtils.fromHtml(content) : [];
        this.addChild(this.okyesnoPanel);

        this.okyesnoPanel.addChild(this.btnYes);
        this.okyesnoPanel.addChild(this.btnNo);
        this.okyesnoPanel.addChild(this.btnOk);

        if (yesno) {
            this.btnYes.text = ViewUtils.getTipText(btnText.yes);
            this.btnNo.text = ViewUtils.getTipText(btnText.no);
            this.okyesnoPanel.removeChild(this.btnOk);
        } else {
            this.btnOk.text = ViewUtils.getTipText(btnText.ok);
            this.okyesnoPanel.removeChild(this.btnYes);
            this.okyesnoPanel.removeChild(this.btnNo);
        }

        this.onBgClicked = this.onConfirmNo;

        return new Promise<boolean>((resolve, reject) => {
            this.confirmOkCallback = resolve;
            this.confirmYesNoCallback = resolve;
        });
    }

    onConfirmOk() {
        this.removeChild(this.okyesnoPanel);
        this.removeChild(this.bg);
        this.confirmOkCallback(true);
    }

    onConfirmYes() {
        this.removeChild(this.okyesnoPanel);
        this.removeChild(this.bg);
        this.confirmYesNoCallback(true);
    }

    onConfirmNo() {
        this.removeChild(this.okyesnoPanel);
        this.removeChild(this.bg);
        this.confirmYesNoCallback(false);
    }
}
