// 商店视图
class ShopView extends egret.DisplayObjectContainer {    
    private static readonly GridNum = 6;
    
    private bg:egret.Bitmap; // 背景
    private grids:egret.Bitmap[] = []; // 商品格子
    private items:string[] = [];
    private btnGoBack;

    public player:Player;
    public confirmYesNo; // yesno 确认

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
        this.btnGoBack.x = 10;
        this.btnGoBack.y = this.height - this.btnGoBack.height - 10;
        this.btnGoBack.touchEnabled = true;
        this.addChild(this.btnGoBack);
        this.btnGoBack.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onGoBack, this);
    }

    private onCancel;
    private onBuy;
    public async open(shop, autoClose:boolean = true):Promise<string> {
        var rand = new SRandom();
        var cfg = GCfg.getShopCfg(shop);

        for(var i = 0; i < ShopView.GridNum; i++) {
            var e = Utils.randomSelectByWeight(cfg[i], rand, 1, 2)[0];
            this.items.push(e);
        }

        this.refresh();
        return new Promise<string>((resolve, reject) => {
            this.onBuy = (item) => {
                var price = 5; // 先固定价格
                if (!this.player.addMoney(price)) {
                    Utils.log("钱不够");
                    return;
                }

                var e = ElemFactory.create(item);
                if (e instanceof Prop) {
                    var prop = (e as Prop).toProp();
                    this.player.addProp(prop);
                } else if (e instanceof Relic) {
                    var relic = (e as Relic).toRelic();
                    this.player.addRelic(relic);
                } else
                    Utils.assert(false, "only prop or relic can be sold in shop, got: " + typeof(e));

                if (autoClose)
                    resolve(item);
            };
            this.onCancel = reject;
        });
    }

    public refresh() {
        for(var gd of this.grids)
            ViewUtils.setTex(gd, this.items[gd["itemIndex"]] + "_png");
    }

    onGoBack(evt:egret.TouchEvent) {
        this.onCancel(undefined);
    }

    async onSelItem(evt:egret.TouchEvent) {
        var n = evt.target["itemIndex"];
        var item = this.items[n];
        var yesno = await this.confirmYesNo("确定购买 " + item + "，花费 5 金币 ?");
        if (yesno)
            this.onBuy(item);
    }
}
