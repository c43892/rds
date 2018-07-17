// 宝箱房间视图
class BoxRoomView extends egret.DisplayObjectContainer {
    public player:Player; // 当前玩家数据

    private box:egret.Bitmap;
    private e:egret.Bitmap;
    private close:egret.Bitmap;
    
    public constructor(w:number, h:number) {
        super();
        this.width = w;
        this.height = h;

        this.box = ViewUtils.createBitmapByName("BoxRoomBox_png");
        this.box.x = (this.width - this.box.width) / 2;
        this.box.y = (this.height - this.box.height) / 2;
        this.addChild(this.box);
        this.box.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onOpenBox, this);
        this.box.touchEnabled = true;

        this.close = ViewUtils.createBitmapByName("goBack2_png");
        this.close.x = this.width - this.close.width;
        this.close.y = this.height - this.close.height;
        this.addChild(this.close);
        this.close.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onClose, this);
        this.close.touchEnabled = true;
    }

    private dropItem;
    private doClose;
    public async open(dropCfg):Promise<void> {
        var arr = Utils.randomSelectByWeightWithPlayerFilter(this.player, dropCfg, this.player.playerRandom, 1, 2, true, "Coins");
        this.dropItem = arr[0];
        ViewUtils.setTex(this.box, "BoxRoomBox_png");

        if (this.e) this.removeChild(this.e);

        return new Promise<void>((resolve, reject) => this.doClose = resolve);
    }

    async onClose(evt:egret.TouchEvent) {
        this.doClose();
    }

    async onOpenBox(evt:egret.TouchEvent) {
        if (!this.dropItem) return;

        var dp = ElemFactory.create(this.dropItem);
        this.player.addItem(dp);

        this.e = ViewUtils.createBitmapByName(dp.getElemImgRes() + "_png");
        this.e.x = (this.width - this.e.width) / 2;
        this.e.y = (this.height - this.e.height) / 2;
        this.addChild(this.e);

        ViewUtils.setTex(this.box, "BoxRoomBoxOpened_png");
        this.dropItem = undefined;
    }
}