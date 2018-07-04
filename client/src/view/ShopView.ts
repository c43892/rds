// 商店视图
class ShopView extends egret.DisplayObjectContainer {    
    private static readonly GridNum = 6;
    
    private bg:egret.Bitmap; // 背景
    private grids:egret.Bitmap[] = []; // 商品格子
    private items:string[] = [];
    private btnGoBack;
    private goBackCallback;

    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.addChild(this.bg);
        this.bg.width = this.width;
        this.bg.height = this.height;

        var gdw = this.width / 5;
        var space = gdw / 2;
        var gdh = gdw;
        for (var i = 0; i < ShopView.GridNum; i++) {
            var gd = ViewUtils.createBitmapByName("soldout_png");
            this.grids.push(gd);
            gd.touchEnabled = true;
            gd.width = gdw;
            gd.height = gdh;
            gd.x = space + (i % 3) * (space + gdw);
            gd.y = this.height / 2 + (i >= 3 ? space : -gdh - space);
            gd["itemIndex"] = i;
            this.addChild(gd);
            gd.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onSelItem, this);
        }

        this.btnGoBack = ViewUtils.createBitmapByName("goBack_png")
        this.addChild(this.btnGoBack);
        this.btnGoBack.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onGoBack, this);
        this.btnGoBack.x = 10;
        this.btnGoBack.y = this.height - this.btnGoBack.height - 10;
    }

    public async open(shop):Promise<string> {
        var rand = new SRandom();
        var cfg = GCfg.getShopCfg(shop);

        for(var i = 0; i < ShopView.GridNum; i++) {
            var e = Utils.randomSelectByWeight(cfg[i], rand, 1, 2)[0];
            this.items.push(e);
        }

        this.refresh();
        return new Promise<string>((resolve, reject) => this.goBackCallback = resolve);
    }

    public refresh() {
        for(var gd of this.grids)
            ViewUtils.setTex(gd, this.items[gd["itemIndex"]] + "_png");
    }

    onGoBack(evt:egret.TouchEvent) {
        this.goBackCallback(undefined);
    }

    onSelItem(evt:egret.TouchEvent) {
        var n = evt.target["itemIndex"];
        var item = this.items[n];
        Utils.log(item);
    }

    onBuyItem(evt:egret.TouchEvent) {
    }
}
