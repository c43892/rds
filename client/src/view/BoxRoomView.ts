// 宝箱房间视图
class BoxRoomView extends egret.DisplayObjectContainer {
    public player:Player; // 当前玩家数据

    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private openBoxBtn:TextButtonWithBg;
    private box:egret.Bitmap;
    private e:egret.Bitmap;
    private elems:TextButtonWithBg[];
    private goOutBtn:egret.Bitmap;
    private startingPoint:egret.Bitmap;
    private destination:egret.Bitmap;
    
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
        this.box.x = (this.width - this.box.width) / 2;
        this.box.y = (this.height - this.box.height) / 2;
        this.box.touchEnabled = true;

        this.openBoxBtn = new TextButtonWithBg("btnBg_png", 30);
        this.openBoxBtn.text = ViewUtils.getTipText("openBox");
        this.openBoxBtn.anchorOffsetX = this.openBoxBtn.width / 2;
        this.openBoxBtn.anchorOffsetY = this.openBoxBtn.height / 2;
        this.openBoxBtn.name = "openBoxBtn";
        this.openBoxBtn.onClicked = async () => await this.onOpenBox();

        this.goOutBtn = ViewUtils.createBitmapByName("turntableGoOutBtn_png");
        this.goOutBtn.name = "goOutBtn"
        this.addChild(this.goOutBtn);
        this.goOutBtn.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClose, this);
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
        for (var elem of this.elems)            
            this.removeChild(elem);

        this.elems = [];
        this.openBoxBtn.touchEnabled = true;
        var onOpenBoxRoomPs = {num :4};
        await this.player.fireEvent("onOpenBoxRoom", onOpenBoxRoomPs);
        var num = onOpenBoxRoomPs.num;
        var arr = Utils.randomSelectByWeightWithPlayerFilter(this.player, dropCfg, this.player.playerRandom, num, num + 1, true, "Coins");
        for(var i = 0; i < arr.length; i++){
            let elem = new TextButtonWithBg(arr[i] + "_png");
            elem.touchEnabled = true;
            elem.x = 320 + (i - (arr.length - 1) / 2) * 114;
            elem.y = 430;
            elem.anchorOffsetX = elem.width / 2;
            elem.anchorOffsetY = elem.height / 2;
            elem["eType"] = arr[i];
            elem.onClicked = () => this.getDropItem(elem);
            this.elems.push(elem);
            this.addChild(elem);
            elem.alpha = 0;
            elem.touchEnabled = false;
        }

        ViewUtils.setTexName(this.box, "BoxRoomBox_png");
        
        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    async onClose() {
        this.doClose();
    }

    async onOpenBox() {
        this.openBoxBtn.touchEnabled = false;

        if (this.elems.length == 0) return;

        ViewUtils.setTexName(this.box, "BoxRoomBoxOpened_png");

        for (var elem of this.elems){
            var fromImg = AniUtils.createImg(elem["eType"] + "_png");
            fromImg.anchorOffsetX = fromImg.width / 2;
            fromImg.anchorOffsetY = fromImg.height / 2;
            fromImg.x = this.startingPoint.x;
            fromImg.y = this.startingPoint.y;
            fromImg.width = elem.width / 2;
            fromImg.height = elem.height / 2;
            await AniUtils.flash(fromImg, 200);
            var toImg = elem;
            await AniUtils.fly2(fromImg, fromImg, toImg, true, 1);
            fromImg["dispose"]();
            elem.alpha = 1;
            elem.touchEnabled = true;
        }
    }

    async getDropItem(elem:TextButtonWithBg) {
        this.removeChild(elem);
        this.elems = Utils.remove(this.elems, elem);
        var fromImg = AniUtils.createImg(elem["eType"] + "_png");
        fromImg.anchorOffsetX = fromImg.width / 2;
        fromImg.anchorOffsetY = fromImg.height / 2;
        fromImg.x = elem.x;
        fromImg.y = elem.y;
        fromImg.width = elem.width;
        fromImg.height = elem.height;
        await AniUtils.flash(fromImg, 200);
        var toImg = this.destination;
        await AniUtils.fly2(fromImg, fromImg, toImg, true, 1);
        fromImg["dispose"]();

        elem.touchEnabled = false;
        var e = ElemFactory.create(elem["eType"]);

        this.player.addItem(e);
    }
}