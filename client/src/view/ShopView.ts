// 商店视图
class ShopView extends egret.DisplayObjectContainer {    
    private static readonly GridNum = 6;
    
    private bg:egret.Bitmap; // 背景
    private bg1:egret.Bitmap; // 底图
    private grids:egret.Bitmap[] = []; // 商品格子
    private prices:egret.TextField[] = []; // 商品价格
    private items:Elem[] = [];
    private itemPrices = {};    
    private soldOut:boolean[] = [];
    private btnGoBack;

    public player:Player;

    private confirmView:ShopConfirmView;
    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;
        this.name = "shop";
        this.confirmView = new ShopConfirmView(w, h);

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.addChild(this.bg);
        this.bg.touchEnabled = true;
        this.bg.width = this.width;
        this.bg.height = this.height;

        this.bg1 = ViewUtils.createBitmapByName("svbg_png");
        this.bg1.name = "bg1";
        this.addChild(this.bg1);

        for (var i = 0; i < ShopView.GridNum; i++) {
            var gd = ViewUtils.createBitmapByName("soldout_png");
            this.grids.push(gd);
            gd.touchEnabled = true;
            gd["itemIndex"] = i;
            gd.name = "grid" + i.toString();
            this.addChild(gd);
            gd.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onSelItem, this);

            var pt = ViewUtils.createTextField(20, 0xffffff);
            pt.textAlign = egret.HorizontalAlign.LEFT;
            pt.name = "price" + i.toString();
            this.prices.push(pt);
            this.addChild(pt);

            this.soldOut.push(false);
        }

        this.btnGoBack = ViewUtils.createBitmapByName("goBack_png")
        this.btnGoBack.name = "btnGoBack";
        this.btnGoBack.touchEnabled = true;
        this.addChild(this.btnGoBack);
        this.btnGoBack.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onGoBack, this);

        ViewUtils.multiLang(this, this.bg1, ...this.grids, ...this.prices, this.btnGoBack);
    }

    private onCancel;
    private onSel;
    public async open(items, prices, onBuy):Promise<void> {
        this.items = Utils.map(items, (it) => ElemFactory.create(it));
        this.itemPrices = prices;
        this.refresh();
        return new Promise<void>((resolve, reject) => {
            this.onSel = async (n) => {
                if (this.soldOut[n]) {
                    Utils.log("已售罄");
                    return;
                }

                var e = this.items[n];
                var price = this.itemPrices[e.type];
                if (this.player.money - price < 0) {
                    Utils.log("金币不足");
                    return;
                }

                this.soldOut[n] = true;
                var closeShop = await onBuy(e, price);
                
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
                this.prices[i].text = this.itemPrices[e.type];
                ViewUtils.setTexName(gd, e.getElemImgRes() + "_png");
                gd.touchEnabled = true;
            }
        }
    }

    onGoBack(evt:egret.TouchEvent) {
        this.onCancel();
    }

    public static lastSelectedElemGlobalPos;
    async onSelItem(evt:egret.TouchEvent) {
        var n = evt.target["itemIndex"];
        var e = this.items[n];
        this.addChild(this.confirmView);
        var yesno = await this.confirmView.open(this.player, e, this.itemPrices[e.type]);
        this.removeChild(this.confirmView);
        if (yesno) {
            ShopView.lastSelectedElemGlobalPos = ViewUtils.getGlobalPosAndSize(this.grids[n]);
            await this.onSel(n);
        }
    }
}
