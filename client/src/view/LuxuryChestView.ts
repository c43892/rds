class LuxuryChestView extends egret.DisplayObjectContainer {
    private relics:Relic[]; // 宝箱中的技能
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private shineImg:egret.Bitmap;
    private goBackBtn:TextButtonWithBg;
    private goOnBtn:TextButtonWithBg;
    private relicImgs:egret.Bitmap[] = [];
    private relicImg1:egret.Bitmap;
    private relicImg2:egret.Bitmap;
    private relicImg3:egret.Bitmap;
    private relicDesc:ElemDescView;
    private num:number;

    constructor(w, h){
        super();
        this.width = w;
        this.height = h;
        this.name = "LuxuryChestView"; 

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.name = "bg";
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.touchEnabled = true;

        this.bg1 = ViewUtils.createBitmapByName("LuxuryChestBg_png");
        this.bg1.name = "bg1";

        this.shineImg = ViewUtils.createBitmapByName("BoxRoomFlash_png");
        this.shineImg.name = "shineImg";
        this.shineImg.anchorOffsetX = this.shineImg.width / 2;
        this.shineImg.anchorOffsetY = this.shineImg.height / 2;

        this.relicImg1 = new egret.Bitmap();
        this.relicImg1.name = "relicImg1";
        this.relicImg1.touchEnabled = true;
        this.relicImg1.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.onSelectRelic(this.relicImg1), this.relicImg1);

        this.relicImg2 = new egret.Bitmap();
        this.relicImg2.name = "relicImg2";
        this.relicImg2.touchEnabled = true;
        this.relicImg2.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.onSelectRelic(this.relicImg2), this.relicImg2);

        this.relicImg3 = new egret.Bitmap();
        this.relicImg3.name = "relicImg3";
        this.relicImg3.touchEnabled = true;
        this.relicImg3.addEventListener(egret.TouchEvent.TOUCH_TAP, () => this.onSelectRelic(this.relicImg3), this.relicImg3);

        this.relicImgs.push(this.relicImg1, this.relicImg2, this.relicImg3);

        this.goBackBtn = new ArrowButton(false, "goBack_png", 30);
        this.goBackBtn.name = "goBackBtn";
        this.goBackBtn.text = ViewUtils.getTipText("goBackBtn");
        this.goBackBtn.touchEnabled = true;
        this.goBackBtn.onClicked = () => this.onGoBack();

        this.goOnBtn = new ArrowButton(true, "goForward_png", 30);
        this.goOnBtn.name = "goOnBtn";
        this.goOnBtn.text = ViewUtils.getTipText("chooseThisRelic");
        this.goOnBtn.touchEnabled = true;
        this.goOnBtn.onClicked = () => this.onGoOn();

        var objs = [this.bg, this.bg1, this.shineImg, this.relicImg1, this.relicImg2, this.relicImg3, this.goBackBtn];
        ViewUtils.multiLang(this, ...objs);
        objs.forEach((obj, _) => this.addChild(obj));
        
        this.relicDesc = new ElemDescView(w, h);
        this.relicDesc.name = "elemDesc";
        ViewUtils.multiLang(this, this.relicDesc, this.goOnBtn);       

        this.relicImgs.forEach((ri, i) => {
            ri.anchorOffsetX = ri.width / 2;
            ri.anchorOffsetY = ri.height / 2;
        }) 
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

    // 刷新3个技能的图标并根据实际的技能数量确定其位置
    refreshRelics() {
        ViewUtils.multiLang(this, ...this.relicImgs);
        this.num = 0;
        for (var i = 0; i < 3; i++) {
            if (!!this.relics[i]) {
                this.num++;
                ViewUtils.setTexName(this.relicImgs[i], this.relics[i].getElemImgRes() + "_png");
                this.relicImgs[i].scaleX = this.relicImgs[i].scaleY = 1;
                this.relicImgs[i]["relic"] = this.relics[i];      
                this.relicImgs[i].touchEnabled = true;          
            }
            else {
                this.relicImgs[i] = new egret.Bitmap();
                this.relicImgs[i].scaleX = this.relicImgs[i].scaleY = 1;
                this.relicImgs[i]["relic"] = undefined;
                this.relicImgs[i].touchEnabled = false;
            }
        }
        switch(this.num){            
            case 2:{
                this.relicImg1.x = this.relicImg2.x;
                this.relicImg2.x = this.relicImg3.x;
                this.relicImg2.y -= 50;
                this.relicImg1.y = this.relicImg2.y;
                break;
            }
            case 1:{
                this.relicImg1.y += 80;
                break;
            }
        }
    }

    // 刷新详情区域,包括详情和前进按钮
    refreshRelicDescArea(relic:Relic = undefined) {
        this.currentChosenRelic = relic;
        if (!!relic){
            this.refreshDesc(relic);
            ViewUtils.tyr2AddChild(this, this.relicDesc);
            ViewUtils.tyr2AddChild(this, this.goOnBtn);            
        }
        else {
            this.shineImg.alpha = 0;
            ViewUtils.try2RemoveChild(this, this.relicDesc);
            ViewUtils.try2RemoveChild(this, this.goOnBtn);
        }
    }

    // 刷新技能详情内容
    private currentChosenRelic;
    refreshDesc(relic:Relic) {
        this.relicDesc.removeChildren();
        var uiArr = this.relicDesc.buildRelicDescView();
        var refresh = (e) => this.relicDesc.refreshRelicDesc(e, undefined);
        ViewUtils.multiLang(this.relicDesc, ...uiArr);
        uiArr.forEach((ui, _) => this.relicDesc.addChild(ui));
        var descArr = refresh(relic);
    }

    // 点击技能图标后,图标放大增加背光并显示物品详情
    onSelectRelic(relicImg:egret.Bitmap) {
        this.relicImgs.forEach((relicImg, _) => relicImg.scaleX = relicImg.scaleY = 1);
        relicImg.scaleX = relicImg.scaleY = 1.2;
        this.shineImg.x = relicImg.x;
        this.shineImg.y = relicImg.y;
        this.shineImg.alpha = 1;
        this.refreshRelicDescArea(relicImg["relic"]);
    }

    onGoOn() {
        Utils.assert(!!this.currentChosenRelic, "no relic is chosen");
        this.doClose(this.currentChosenRelic);
    }

    onGoBack() {
        this.doClose();
    }
}