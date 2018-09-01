// 商店视图
class ShopView extends egret.DisplayObjectContainer {    
    private static readonly GridNum = 6;
    
    private bg:egret.Bitmap; // 背景
    private bg1:egret.Bitmap; // 底图
    private grids:egret.Bitmap[] = []; // 商品格子
    private prices:egret.TextField[] = []; // 商品价格
    private items:Elem[] = [];
    private soldout:boolean[] = [];
    private itemPrices = {};    
    private btnGoBack;
    private saleIndex;1
    private btnRob:TextButtonWithBg; // 抢劫按钮

    public player:Player;
    public confirmView:ShopConfirmView;

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

            this.soldout.push(false);
        }

        this.btnGoBack = ViewUtils.createBitmapByName("goBack_png")
        this.btnGoBack.name = "btnGoBack";
        this.btnGoBack.touchEnabled = true;
        this.addChild(this.btnGoBack);
        this.btnGoBack.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onGoBack, this);

        this.btnRob = new TextButtonWithBg("btnBg_png", 30);
        this.btnRob.name = "btnRob";
        this.btnRob.text = ViewUtils.getTipText("rob");
        this.btnRob.onClicked = async () => await this.doRob();
        this.addChild(this.btnRob);

        ViewUtils.multiLang(this, this.bg1, ...this.grids, ...this.prices, this.btnGoBack, this.btnRob);
    }

    private onCancel;
    private onSel;
    private onRob;
    public async open(items, prices, onBuy, onRob):Promise<void> {
        this.items = Utils.map(items, (it) => ElemFactory.create(it));
        this.items.forEach((it, i) => this.items[i] = this.soldout[i] ? undefined : this.items[i]);
        this.itemPrices = prices;
        this.onRob = onRob;
        this.refresh();
        return new Promise<void>((resolve, reject) => {
            this.onSel = async (n) => {
                if (!this.items[n]) {
                    Utils.log("已售罄");
                    return;
                }

                var e = this.items[n];
                var price = this.itemPrices[e.type];
                if (this.player.money - price < 0) {
                    Utils.log("金币不足");
                    return;
                }

                this.items[n] = undefined;
                this.soldout[n] = true;
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
            if (!this.items[i]) {
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

        if (this.onRob && !this.contains(this.btnRob))
            this.addChild(this.btnRob);
        else if (!this.onRob && this.contains(this.btnRob))
            this.removeChild(this.btnRob);
    }

    async onGoBack(evt:egret.TouchEvent) {
        await this.onCancel();
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

    // 抢劫
    async doRob() {
        var es = await this.onRob(this.items);
        es.forEach(e => {
            var n = Utils.indexOf(this.items, (it) => it == e);
            Utils.assert(n >= 0 && n < this.items.length && !!this.items[n], "incorrect rob elem index:" + n);
            this.items[n] = undefined;
            this.soldout[n] = true;
            this.refresh();
        });

        if (this.contains(this.btnRob))
            this.removeChild(this.btnRob);

        await this.onCancel();
    }
}
