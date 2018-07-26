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
    public confirmOkYesNo; // yesno 确认

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
    private onSel;
    public async open(shop, rand:SRandom, onBuy, refreshItems:boolean = true):Promise<void> {        
        if (refreshItems) {
            this.defaultPrice = GCfg.getShopCfg("price");
            var cfg = GCfg.getShopCfg(shop);
            this.shopPrice = cfg.price;
            var items = cfg.items;
            this.items = [];
            for(var i = 0; i < ShopView.GridNum; i++) {
                var e = Utils.randomSelectByWeightWithPlayerFilter(this.player, items[i], rand, 1, 2, false)[0];
                Utils.assert(!!e, "no item in shop " + shop + ":" + i);
                this.items.push(e);
                this.soldOut[i] = false;
            }
        }

        this.refresh();
        return new Promise<void>((resolve, reject) => {
            this.onSel = (n) => {
                if (this.soldOut[n]) {
                    Utils.log("已售罄");
                    return;
                }

                var e = this.items[n];
                var price = this.getPrice(e);
                if (!this.player.addMoney(-price)) {
                    Utils.log("金币不足");
                    return;
                }

                var elem = ElemFactory.create(e);
                var closeShop = onBuy(elem);
                this.soldOut[n] = true;
                
                if (closeShop)
                    resolve();
                else
                    this.refresh();
            };
            this.onCancel = resolve;
        });
    }

    public refresh() {
        for(var gd of this.grids) {
            var i = gd["itemIndex"];
            if (this.soldOut[i]) {
                this.prices[i].text = "";
                ViewUtils.setTexName(gd, "soldout_png");
                gd.touchEnabled = false;
            } else {
                var e = this.items[i];
                this.prices[i].text = this.getPrice(e);
                ViewUtils.setTexName(gd, ElemFactory.create(e).getElemImgRes() + "_png");
                gd.touchEnabled = true;
            }
        }
    }

    onGoBack(evt:egret.TouchEvent) {
        this.onCancel();
    }

    async onSelItem(evt:egret.TouchEvent) {
        var n = evt.target["itemIndex"];
        var e = this.items[n];
        var yesno = await this.confirmOkYesNo("确定购买 " + e + "，花费 " + this.getPrice(e) + " 金币 ?");
        if (yesno)
            this.onSel(n);
    }
}
