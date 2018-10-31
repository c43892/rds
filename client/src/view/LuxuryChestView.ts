class LuxuryChestView extends egret.DisplayObjectContainer {
    private relics:Relic[];
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private goBackBtn:TextButtonWithBg;
    private goOnBtn:TextButtonWithBg;
    private relicImgs:TextButtonWithBg[] = [];
    private relicImg1:TextButtonWithBg;
    private relicImg2:TextButtonWithBg;
    private relicImg3:TextButtonWithBg;
    private relicDescArea:egret.DisplayObjectContainer;
    private relicDescBg:egret.Bitmap;
    private relicName:egret.TextField;
    private relicDescText:egret.TextField;
    

    constructor(w, h){
        super();
        this.width = w;
        this.height = h;
        this.name = "LuxuryChestView"; 

        this.bg = new egret.Bitmap();
        this.bg.name = "bg";
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.touchEnabled = true;

        this.bg1 = ViewUtils.createBitmapByName("bigBg_png");
        this.bg1.name = "bg1";

        this.relicImg1 = new TextButtonWithBg(undefined);
        this.relicImg1.name = "relicImg1";

        this.relicImg2 = new TextButtonWithBg(undefined);
        this.relicImg2.name = "relicImg2";

        this.relicImg3 = new TextButtonWithBg(undefined);
        this.relicImg3.name = "relicImg3";

        this.relicImgs.push(this.relicImg1, this.relicImg2, this.relicImg3);
        this.relicImgs.forEach((relicImg, i) => relicImg.onClicked = () => this.refreshRelicDescArea(relicImg));

        this.goBackBtn = new TextButtonWithBg("goBack_png", 30);
        this.goBackBtn.name = "goBackBtn";
        this.goBackBtn.text = ViewUtils.getTipText("goBackBtn");
        this.goBackBtn.touchEnabled = true;
        this.goBackBtn.onClicked = () => this.onGoBack();

        this.relicDescArea = new egret.DisplayObjectContainer();
        this.relicDescArea.name = "relicDescArea";

        this.relicName = new egret.TextField();
        this.relicName.name = "relicName";

        this.goOnBtn = new TextButtonWithBg("goForward_png", 30);
        this.goOnBtn.name = "goOnBtn";
        this.goOnBtn.text = ViewUtils.getTipText("chooseThisRelic");
        this.goOnBtn.touchEnabled = true;
        this.goOnBtn.onClicked = () => this.onGoOn();

        var objs = [this.bg, this.bg1, this.relicImg1, this.relicImg2, this.relicImg3, this.goBackBtn, this.relicDescArea];
        ViewUtils.multiLang(this, ...objs);
        objs.forEach((obj, _) => this.addChild(obj));
    }

    async open(relics:Relic[]) {
        this.relics = relics;
        this.currentChosenRelic = undefined;
        this.refresh();
        return new Promise<Relic>((resolve, reject) => this.doClose = resolve);
    }

    private doClose;

    refresh(){
        this.refreshRelics();
        this.refreshRelicDescArea(undefined);
    }

    refreshRelics() {
        this.relics.forEach((relic, i) => {
            var btn = this.relicImgs[i];
            var container = new egret.DisplayObjectContainer();
            var relicImg = ViewUtils.createBitmapByName(relic.getElemImgRes() + "_png");
            var stars = ViewUtils.createRelicLevelStars(relic, relicImg);
            container.addChild(relicImg);
            stars.forEach((star, i) => container.addChild(star));
            var texture = new egret.RenderTexture();
            texture.drawToTexture(container);
            btn.bg.texture = texture;
            btn.width = btn.bg.width = texture.textureWidth;
            btn.height = btn.bg.height = texture.textureHeight;
            btn["relic"] = relic;
        });
    }

    // 只刷新详情区域
    refreshRelicDescArea(relicImg:egret.DisplayObject = undefined) {
        this.relicDescArea.removeChildren();
        if (!!relicImg){
            this.goOnBtn.touchEnabled = true;
            this.showDesc(relicImg);
        }
        else {
            this.goOnBtn.touchEnabled = false;
        }
    }

    // 管理技能详情内容
    private currentChosenRelic;
    showDesc(relicImg:egret.DisplayObject) {        
        var relic:Relic = relicImg["relic"];
        this.relicName.text = relic.attrs.name;
        this.relicName.width = 200;
        this.relicName.height = 200;
        this.currentChosenRelic = relic;

        this.relicDescBg = ViewUtils.createBitmapByName("confirmBg_png");
        this.relicDescBg.name = "relicDescBg";
        this.relicName = ViewUtils.createTextField(30, 0x200000, false, false);
        this.relicName.name = "relicName";

        var nameAndDesc = ViewUtils.getElemNameAndDesc(relic.type);
        this.relicName.textAlign = egret.HorizontalAlign.LEFT;
        this.relicName.bold =true;
        this.relicName.textFlow = [{text: nameAndDesc.name, style:{"textColor":0x7d0403, "size":30}}];

        var objsInRelicDescArea = [this.relicDescBg, this.relicName, this.goOnBtn];
        ViewUtils.multiLang(this, ...objsInRelicDescArea);
        objsInRelicDescArea.forEach((obj, _) => this.relicDescArea.addChild(obj));
    }

    onGoOn() {
        Utils.assert(!!this.currentChosenRelic, "no relic is chosen");
        this.doClose(this.currentChosenRelic);
    }

    onGoBack() {
        this.doClose();
    }
}