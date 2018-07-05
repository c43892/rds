// 商店视图
class ShopView extends egret.DisplayObjectContainer {    
    private static readonly GridNum = 6;
    
    private bg:egret.Bitmap; // 背景
    private grids:egret.Bitmap[] = []; // 商品格子
    private prices:egret.TextField[] = []; // 商品价格
    private items:string[] = [];
    private soldOut:boolean[] = [];
    private btnGoBack;

    public player:Player;
    public confirmYesNo; // yesno 确认

    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;
        this.touchEnabled = true;

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

            var pt = new egret.TextField();
            pt.x = gd.x;
            pt.y = gd.y + gd.height;
            pt.width = gd.width;
            pt.textColor = 0x000000;
            pt.size = 30;
            pt.textAlign = egret.HorizontalAlign.CENTER;
            pt.verticalAlign = egret.VerticalAlign.MIDDLE;
            this.prices.push(pt);
            this.addChild(pt);

            this.soldOut.push(false);
        }

        this.btnGoBack = ViewUtils.createBitmapByName("goBack_png")
        this.btnGoBack.x = 10;
        this.btnGoBack.y = this.height - this.btnGoBack.height - 10;
        this.btnGoBack.touchEnabled = true;
        this.addChild(this.btnGoBack);
        this.btnGoBack.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onGoBack, this);
    }

    private defaultPrice;
    private shopPrice;
    getPrice(e) {
        return this.shopPrice[e] ? this.shopPrice[e] : this.defaultPrice[e];
    }

    private onCancel;
    private onBuy;
    public async open(shop, autoClose:boolean = true):Promise<void> {
        this.defaultPrice = GCfg.getShopCfg("price");
        var rand = new SRandom();
        var cfg = GCfg.getShopCfg(shop);
        var items = cfg.items;
        this.shopPrice = cfg.price;

        for(var i = 0; i < ShopView.GridNum; i++) {
            var e = Utils.randomSelectByWeight(items[i], rand, 1, 2)[0];
            this.items.push(e);
            this.soldOut[i] = false;
        }

        this.refresh();
        return new Promise<void>((resolve, reject) => {
            this.onBuy = (n) => {
                if (this.soldOut[n]) {
                    Utils.log("已售罄");
                    return;
                }

                var e = this.items[n];
                var price = this.getPrice(e);
                if (!this.player.addMoney(price)) {
                    Utils.log("金币不足");
                    return;
                }

                var elem = ElemFactory.create(e);
                if (elem instanceof Prop) {
                    var prop = (elem as Prop).toProp();
                    this.player.addProp(prop);
                } else if (elem instanceof Relic) {
                    var relic = (elem as Relic).toRelic();
                    this.player.addRelic(relic);
                } else
                    Utils.assert(false, "only prop or relic can be sold in shop, got: " + e);

                this.soldOut[n] = true;
                if (autoClose)
                    resolve();
                else
                    this.refresh();
            };
            this.onCancel = reject;
        });
    }

    public refresh() {
        for(var gd of this.grids) {
            var i = gd["itemIndex"];
            if (this.soldOut[i]) {
                this.prices[i].text = "";
                ViewUtils.setTex(gd, "soldout_png");
            } else {
                var e = this.items[i];
                this.prices[i].text = this.getPrice(e);
                ViewUtils.setTex(gd, ElemFactory.create(e).getElemImgRes() + "_png");
            }
        }
    }

    onGoBack(evt:egret.TouchEvent) {
        this.onCancel();
    }

    async onSelItem(evt:egret.TouchEvent) {
        var n = evt.target["itemIndex"];
        var e = this.items[n];
        var yesno = await this.confirmYesNo("确定购买 " + e + "，花费 " + this.getPrice(e) + " 金币 ?");
        if (yesno)
            this.onBuy(n);
    }
}
