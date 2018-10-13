class RelicExchangeView extends egret.DisplayObjectContainer{
    public player:Player;
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private titleEquiped:egret.TextField;
    private relicEquiped:egret.DisplayObjectContainer;
    private titleInBag:egret.TextField;
    private relicInBag:egret.DisplayObjectContainer;
    private goBackBtn:TextButtonWithBg;
    private goOnBtn:TextButtonWithBg;

    constructor(w, h){
        super();

        this.name = "relicExchange";
        this.width = w;
        this.height = h;

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.x = 0;
        this.bg.y = 0;
        this.bg.width = w;
        this.bg.height = h;
        this.bg.touchEnabled = true;
        this.addChild(this.bg);

        this.bg1 = ViewUtils.createBitmapByName("bigBg_png");
        this.bg1.name = "bg1";

        this.titleEquiped = ViewUtils.createTextField(45, 0x7d0403);
        this.titleEquiped.text = ViewUtils.getTipText("titleEquiped");
        this.titleEquiped.name = "titleEquiped";

        this.relicEquiped = new egret.DisplayObjectContainer();
        this.relicEquiped.name = "relicEquiped";

        this.titleInBag = ViewUtils.createTextField(45, 0x7d0403);
        this.titleInBag.text = ViewUtils.getTipText("titleInBag");
        this.titleInBag.name = "titleInBag";

        this.relicInBag = new egret.DisplayObjectContainer();
        this.relicInBag.name = "relicInBag";

        this.goBackBtn = new TextButtonWithBg("goBack_png", 30);
        this.goBackBtn.name = "goBackBtn";
        this.goBackBtn.text = ViewUtils.getTipText("goBackBtn");
        this.goBackBtn.touchEnabled = true;
        this.goBackBtn.onClicked = () => this.goBack();

        this.goOnBtn = new TextButtonWithBg("goForward_png", 30);
        this.goOnBtn.name = "goOnBtn";
        this.goOnBtn.text = ViewUtils.getTipText("continueBtn");
        this.goOnBtn.touchEnabled = true;
        this.goOnBtn.onClicked = () => this.goOn();

        var objs = [this.bg1, this.titleEquiped, this.relicEquiped, this.titleInBag, this.relicInBag, this.goBackBtn, this.goOnBtn];
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);
    }

    public async open() {
        this.refresh();
        return new Promise<number>((resolve, reject) => this.doClose = resolve);
    }

    private doClose;

    private refresh() {
        this.refreshRelicEquiped();
        this.refreshRelicInBag();
    }

    private refreshRelicEquiped() {

    }

    private refreshRelicInBag() {

    }

    async goBack() {
        this.doClose(-1);
    }

    async goOn() {
        this.doClose(1);
    }

}