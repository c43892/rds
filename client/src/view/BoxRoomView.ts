// 宝箱房间视图
class BoxRoomView extends egret.DisplayObjectContainer {
    public player:Player; // 当前玩家数据

    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private openBoxBtn:TextButtonWithBg;
    private box:egret.Bitmap;
    private e:egret.Bitmap;
    private elems:TextButtonWithBg[];
    private goOutBtn:TextButtonWithBg;
    private startingPoint:egret.Bitmap;
    private destination:egret.Bitmap;
    private boxEff:egret.MovieClip;
    public confirmOkYesNo;
    public static showElemDesc;
    
    public constructor(w:number, h:number) {
        super();
        this.width = w;
        this.height = h;
        this.name = "boxRoomView";

        this.elems = [];

        this.bg = ViewUtils.createBitmapByName("translucent_png");        
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.touchEnabled = true;
        this.addChild(this.bg);

        this.bg1 = ViewUtils.createBitmapByName("bigBg_png");
        this.bg1.name = "bg1";

        this.box = ViewUtils.createBitmapByName("BoxRoomBox_png");
        this.box.name = "box";
        this.box.touchEnabled = true;

        this.boxEff = ViewUtils.createFrameAni("effTB");
        this.boxEff.name = "boxEff";

        this.openBoxBtn = new TextButtonWithBg("btnBg_png", 30);
        this.openBoxBtn.text = ViewUtils.getTipText("openBox");
        this.openBoxBtn.anchorOffsetX = this.openBoxBtn.width / 2;
        this.openBoxBtn.anchorOffsetY = this.openBoxBtn.height / 2;
        this.openBoxBtn.name = "openBoxBtn";
        this.openBoxBtn.onClicked = async () => await this.onOpenBox();

        this.goOutBtn = new TextButtonWithBg("goForward_png", 30);
        this.goOutBtn.text = ViewUtils.getTipText("continueBtn");
        this.goOutBtn.name = "goOutBtn"
        this.goOutBtn.onClicked = async () => await this.onClose();
        this.goOutBtn.touchEnabled = true;

        this.destination = new egret.Bitmap();
        this.destination.name = "destination";

        this.startingPoint = new egret.Bitmap();
        this.startingPoint.name = "startingPoint";

        var objs = [this.bg1, this.box, this.openBoxBtn, this.goOutBtn, this.destination, this.startingPoint];
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);
    }

    private dropItems;
    private doClose;
    public async open(dropCfg):Promise<void> {
        this.elems = [];
        this.openBoxBtn.touchEnabled = true;
        this.addChild(this.openBoxBtn)
        
        var onOpenBoxRoomPs = {num:3};
        await this.player.fireEvent("onOpenBoxRoom", onOpenBoxRoomPs);
        var num = onOpenBoxRoomPs.num;
        var arr = Utils.randomSelectByWeightWithPlayerFilter(this.player, dropCfg, this.player.playerRandom, num, num + 1, true, "Coins");
        for(var i = 0; i < arr.length; i++){
            let elem = new TextButtonWithBg(arr[i] + "_png");
            elem.touchEnabled = true;
            elem.x = 320 + (i - (arr.length - 1) / 2) * 114 - 42;
            elem.y = 380 - 42;
            elem["eType"] = arr[i];
            this.elems.push(elem);
            this.addChild(elem);
            elem.alpha = 0;
            elem.touchEnabled = false;
            elem.onClicked = () => BoxRoomView.showElemDesc(ElemFactory.create(elem["eType"]));
        }

        ViewUtils.setTexName(this.box, "BoxRoomBox_png");
        
        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    async onClose() {
        await this.getDropItems();
        this.doClose();
    }

    async onOpenBox() {
        this.openBoxBtn.touchEnabled = false;
        this.removeChild(this.openBoxBtn);

        if (this.elems.length == 0) return;

        ViewUtils.multiLang(this, this.boxEff);
        this.addChild(this.boxEff);
        this.boxEff.gotoAndPlay(0, 1);
        await this.boxEff["wait"]();
        this.removeChild(this.boxEff);
        
        ViewUtils.setTexName(this.box, "BoxRoomBoxOpened_png");

        var fromImgs = [];
        for (var i = 0; i < this.elems.length; i++){
            let elem = this.elems[i];
            let fromImg = AniUtils.createImg(elem["eType"] + "_png");
            fromImgs.push(fromImg);
            fromImg.x = this.startingPoint.x;
            fromImg.y = this.startingPoint.y;
            fromImg.width = elem.width / 2;
            fromImg.height = elem.height / 2;            
            var toImg = elem;
            await Utils.delay(200);
            if(i == this.elems.length - 1){
                await AniUtils.flash(fromImg, 200);            
                await AniUtils.fly2(fromImg, fromImg, toImg, true, 1);
                fromImg["dispose"]();
                elem.alpha = 1;
                elem.touchEnabled = true;
            }
            else{
                AniUtils.flash(fromImg, 200);
                AniUtils.fly2(fromImg, fromImg, toImg, true, 1).then(() => {
                    fromImg["dispose"]();
                    elem.alpha = 1;
                    elem.touchEnabled = true;
                });
            }
        }
    }

    async getDropItems() {
        for (var i = 0; i < this.elems.length; i++) {
            let elem = this.elems[i];
            this.removeChild(elem);
            let fromImg = AniUtils.createImg(elem["eType"] + "_png");
            fromImg.x = elem.x;
            fromImg.y = elem.y;
            fromImg.width = elem.width;
            fromImg.height = elem.height;            
            var toImg = this.destination;
            await Utils.delay(200);
            if(i == this.elems.length - 1){
                await AniUtils.flash(fromImg, 200);
                await AniUtils.fly2(fromImg, fromImg, toImg, true, 1);
                fromImg["dispose"]();
                elem.touchEnabled = false;
            }
            else{
                AniUtils.flash(fromImg, 200);
                AniUtils.fly2(fromImg, fromImg, toImg, true, 1).then(() => fromImg["dispose"]());                
            }

            var e = ElemFactory.create(elem["eType"]);

            this.player.addItem(e);
        }
    }
}