class NewAchvView extends egret.DisplayObjectContainer {
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private title:egret.TextField;
    private achvName:egret.TextField;
    private achvIcon:egret.Bitmap;
    private goOnBtn:ArrowButton;
    
    public newAchvs:Achievement[] = [];
    private currentAchv:Achievement;
    public isOpened:boolean = false;

    public openAchvDescView;

    constructor (w, h){
        super();
        this.width = w;
        this.height = h;
        this.name = "newAchvView"

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.x = 0;
        this.bg.y = 0;
        this.bg.width = w;
        this.bg.height = h;
        this.bg.touchEnabled = true;

        this.bg1 = ViewUtils.createBitmapByName("confirmBg_png");
        this.bg1.name = "bg1";
        this.bg1.touchEnabled = true;

        this.title = ViewUtils.createTextField(25, 0x000000);
        this.title.name = "title";
        this.title.text = ViewUtils.getTipText("getNewAchvTitle");

        this.achvName = ViewUtils.createTextField(35, 0x000000);
        this.achvName.name = "achvName";
        this.achvName.touchEnabled = true;
        this.achvName.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.onClickAchvIcon(), this);
        
        this.achvIcon = new egret.Bitmap();
        this.achvIcon.name = "achvIcon";
        this.achvIcon.touchEnabled = true;
        this.achvIcon.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.onClickAchvIcon(), this);

        this.goOnBtn = new ArrowButton(true, "goForward_png", 30);
        this.goOnBtn.name = "goOnBtn";
        this.goOnBtn.text = ViewUtils.getTipText("continueBtn");
        this.goOnBtn.onClicked = () => this.onGoOnBtn();

        var objs = [this.bg, this.bg1, this.title, this.achvName, this.achvIcon, this.goOnBtn];
        ViewUtils.multiLang(this, ...objs);
        objs.forEach((obj, _) => this.addChild(obj));
    }

    public async open(achv:Achievement) {
        this.isOpened = true;
        this.currentAchv = achv;
        this.newAchvs.push(achv);
        this.refresh();
        return new Promise((resolve, reject) => this.doClose = resolve);
    }

    doClose;

    refresh() {
        // 刷新成就信息
        var cfg = GCfg.getAchvDescCfg(this.currentAchv.type);

        this.achvName.text = cfg.title;

        ViewUtils.setTexName(this.achvIcon, cfg.icon + "_png");
    }

    onGoOnBtn() {
        if (this.newAchvs.length > 1) {
            this.newAchvs = Utils.removeAt(this.newAchvs, 0);
            this.currentAchv = this.newAchvs[0];
            this.refresh();
        } else{
            this.isOpened = false;
            this.doClose();
        }
    }

    // 打开成就详情界面
    async onClickAchvIcon() {
        this.bg.alpha = 0;
        await this.openAchvDescView(this.currentAchv);
        this.bg.alpha = 1;
    }

    // 增加待显示的成就
    public addNewAchv(achv:Achievement){
        this.newAchvs.push(achv);
    }
}