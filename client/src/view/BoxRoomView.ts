// 宝箱房间视图
class BoxRoomView extends egret.DisplayObjectContainer {
    public player:Player; // 当前玩家数据

    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private openBoxBtn:TextButtonWithBg;
    private box:egret.Bitmap;
    private e:egret.Bitmap;
    private elemImgs:TextButtonWithBg[];
    private goOutBtn:TextButtonWithBg;
    private startingPoint:egret.Bitmap;
    private destination:egret.Bitmap;
    private boxEff:egret.MovieClip;
    private scale:number;
    public confirmOkYesNo;
    public static showElemDesc;
    
    public constructor(w:number, h:number) {
        super();
        this.width = w;
        this.height = h;
        this.name = "boxRoomView";

        this.elemImgs = [];

        this.bg = ViewUtils.createBitmapByName("translucent_png");        
        this.bg.width = this.width;
        this.bg.height = this.height;
        this.bg.touchEnabled = true;
        this.addChild(this.bg);

        this.bg1 = ViewUtils.createBitmapByName("bigBg_png");
        this.bg1.name = "bg1";

        this.box = ViewUtils.createBitmapByName("BoxRoomBox_png");
        this.box.name = "box";
        this.box.anchorOffsetX = this.box.width / 2;
        this.box.anchorOffsetY = this.box.height / 2;
        this.box.touchEnabled = true;

        this.boxEff = ViewUtils.createFrameAni("effTB");
        this.boxEff.name = "boxEff";

        this.openBoxBtn = new TextButtonWithBg("btnBg_png", 30);
        this.openBoxBtn.text = ViewUtils.getTipText("openBox");
        this.openBoxBtn.anchorOffsetX = this.openBoxBtn.width / 2;
        this.openBoxBtn.anchorOffsetY = this.openBoxBtn.height / 2;
        this.openBoxBtn.name = "openBoxBtn";
        this.openBoxBtn.onClicked = () => this.onOpenBox();

        this.goOutBtn = new ArrowButton(true, "goForward_png", 30);
        this.goOutBtn.text = ViewUtils.getTipText("continueBtn");
        this.goOutBtn.name = "goOutBtn"
        this.goOutBtn.onClicked = () => this.onClose();
        this.goOutBtn.touchEnabled = true;

        this.destination = new egret.Bitmap();
        this.destination.name = "destination";

        this.startingPoint = new egret.Bitmap();
        this.startingPoint.name = "startingPoint";

        var objs = [this.bg1, this.box, this.openBoxBtn, this.goOutBtn, this.destination, this.startingPoint];
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);        
        this.removeChild(this.goOutBtn);
    }

    private dropItems;
    private doClose;
    public async open() {        
        this.box.anchorOffsetY = this.box.height / 2; // 宝箱动画修改过宝箱图的坐标和锚点
        ViewUtils.multiLang(this, this.box);
        this.elemImgs = [];
        this.openBoxBtn.touchEnabled = true;
        this.addChild(this.openBoxBtn);

        var cfg = this.player.worldmap.cfg.boxroomDrops;
        var arr = [];
        
        // 有可能有遗物改变这个数量
        var onOpenBoxRoomPs = {relicNum:1, propNum:1, coinsnum:cfg.coins};
        this.player.triggerLogicPointSync("onOpenBoxRoom", onOpenBoxRoomPs);

        // 宝箱中的遗物
        var relicNum = onOpenBoxRoomPs.relicNum;
        var relicCfg = GCfg.getRandomDropGroupCfg(cfg.relic);
        var relics = Utils.randomSelectByWeightWithPlayerFilter(this.player, relicCfg.elems, this.player.playerRandom, relicNum, relicNum + 1, true);
        arr.push(...relics);

        // 宝箱中的道具
        var propNum = onOpenBoxRoomPs.propNum;
        var propCfg = GCfg.getRandomDropGroupCfg(cfg.prop);
        var props = Utils.randomSelectByWeightWithPlayerFilter(this.player, propCfg.elems, this.player.playerRandom, propNum, propNum + 1, true);
        arr.push(...props);

        // 宝箱中的金币
        var coinsnum = onOpenBoxRoomPs.coinsnum;
        arr.push("Coins");
        
        this.scale = arr.length == 3 ? 1.3 : 1;
        
        for(var i = 0; i < arr.length; i++){
            let elemImg = new TextButtonWithBg((arr[i] == "Coins" ? "Coins9" : arr[i]) + "_png");
            elemImg.touchEnabled = true;
            elemImg.x = 320 + (i - (arr.length - 1) / 2) * 120 * this.scale - 42 * this.scale;
            elemImg.y = 430 - 42 / this.scale;
            elemImg.scaleX = elemImg.scaleY = this.scale;
            this.elemImgs.push(elemImg);
            elemImg["flashBg"] = this.setElemImgFlashBg(elemImg, this.scale);
            elemImg["flashBg"].alpha = 0;
            this.addChild(elemImg["flashBg"]);
            this.addChild(elemImg);
            elemImg.alpha = 0;
            elemImg.touchEnabled = false;
            if (arr[i] != "Coins")
                elemImg["e"] = ElemFactory.create(arr[i]);
            else
                elemImg["e"] = ElemFactory.create(arr[i], {cnt:coinsnum});
            
            elemImg.onClicked = () => BoxRoomView.showElemDesc(elemImg["e"]);            
        }

        ViewUtils.setTexName(this.box, "BoxRoomBox_png");

        // 宝箱动画
        egret.Tween.removeTweens(this.box);
        this.box.anchorOffsetY = this.box.height * 3 / 4;
        this.box.y = this.box.y + this.box.height * (3 / 4 - 1 / 2);
        egret.Tween.get(this.box, {loop:true}).to({rotation:0}, 1000)
            .to({rotation:-15}, 50)
            .to({rotation:15}, 100)
            .to({rotation:-7}, 75)
            .to({rotation:7}, 50)
            .to({rotation:0}, 25)
            .to({rotation:0}, 2000);

        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    async onClose() {
        this.removeChild(this.goOutBtn);
        await this.getDropItems();
        this.doClose();
    }

    async onOpenBox() {
        egret.Tween.removeTweens(this.box);
        this.box.rotation = 0;
        this.openBoxBtn.touchEnabled = false;
        this.removeChild(this.openBoxBtn);

        if (this.elemImgs.length == 0) return;

        ViewUtils.multiLang(this, this.boxEff);
        this.addChild(this.boxEff);
        this.boxEff.gotoAndPlay(0, 1);
        await this.boxEff["wait"]();
        this.removeChild(this.boxEff);
        
        ViewUtils.setTexName(this.box, "BoxRoomBoxOpened_png");

        var fromImgs = [];
        for (var i = 0; i < this.elemImgs.length; i++){
            let elemImg = this.elemImgs[i];
            let fromImg = AniUtils.createImg(elemImg["e"].getElemImgRes() + "_png");
            fromImgs.push(fromImg);
            fromImg.x = this.startingPoint.x;
            fromImg.y = this.startingPoint.y;
            fromImg.width = elemImg.width / 2;
            fromImg.height = elemImg.height / 2;
            fromImg.scaleX = fromImg.scaleY = this.scale;
            var toImg = elemImg;
            await Utils.delay(200);
            if(i == this.elemImgs.length - 1){
                await AniUtils.flash(fromImg, 200, false);            
                await AniUtils.fly2(fromImg, fromImg, toImg, false, 1);
                fromImg["dispose"]();
                elemImg.alpha = 1;
                elemImg["flashBg"].alpha = 1;
                elemImg.touchEnabled = true;
            }
            else{
                AniUtils.flash(fromImg, 200, false);
                AniUtils.fly2(fromImg, fromImg, toImg, true, 1).then(() => {
                    fromImg["dispose"]();
                    elemImg.alpha = 1;
                    elemImg["flashBg"].alpha = 1;
                    elemImg.touchEnabled = true;
                });
            }
        }
        this.addChild(this.goOutBtn);
    }

    async getDropItems() {
        for (var i = 0; i < this.elemImgs.length; i++) {
            let elemImg = this.elemImgs[i];
            this.removeChild(elemImg);
            let e = <Elem>elemImg["e"];
            let fromImg = AniUtils.createImg(e.getElemImgRes() + "_png");
            fromImg.x = elemImg.x;
            fromImg.y = elemImg.y;
            fromImg.width = elemImg.width;
            fromImg.height = elemImg.height;
            fromImg.scaleX = fromImg.scaleY = this.scale;
            var toImg = this.destination;
            await Utils.delay(200);
            if(i == this.elemImgs.length - 1){
                this.removeChild(elemImg["flashBg"]);
                await AniUtils.flash(fromImg, 200, false);
                await AniUtils.fly2(fromImg, fromImg, toImg, false, 1);
                fromImg["dispose"]();
                elemImg.touchEnabled = false;
            }
            else{
                this.removeChild(elemImg["flashBg"]);
                AniUtils.flash(fromImg, 200, false);
                AniUtils.fly2(fromImg, fromImg, toImg, false, 1).then(() => {
                    fromImg["dispose"]();
                });
            }
            this.player.addItem(e);
        }
    }

    // 添加元素图标的背景闪光
    setElemImgFlashBg(img:egret.DisplayObject, scale:number){
        let flashBg = ViewUtils.createBitmapByName("BoxRoomFlash_png");
        flashBg.anchorOffsetX = flashBg.width / 2;
        flashBg.anchorOffsetY = flashBg.height / 2;
        flashBg.x = img.x + img.width * scale / 2;
        flashBg.y = img.y + img.height * scale / 2;
        flashBg.scaleX = flashBg.scaleY = scale;
        return flashBg;
    }
}