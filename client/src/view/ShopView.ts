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
    private btnGoBack:TextButtonWithBg;
    private saleIndex;1
    private btnRob:TextButtonWithBg; // 抢劫按钮

    public player:Player;
    public openConfirmView;

    public get shopNpcSlotGlobalPos() {
        var p = AniUtils.ani2global(this.bg1);
        p.x += 400;
        p.y += 40;
        return p;
    };
    
    public constructor(w:number, h:number) {
        super();

        this.width = w;
        this.height = h;
        this.name = "shop";

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

        this.btnGoBack = new ArrowButton(false, "goBack_png", 30)
        this.btnGoBack.name = "btnGoBack";
        this.btnGoBack.touchEnabled = true;
        this.addChild(this.btnGoBack);
        this.btnGoBack.text = ViewUtils.getTipText("goBackBtn");
        this.btnGoBack.onClicked = () => this.onGoBack();

        this.btnRob = new TextButtonWithBg("btnRob_png", 0);
        this.btnRob.name = "btnRob";
        this.btnRob.onClicked = async () => {
            await this.doRob();
            if (this.onRobbed)
                await this.onRobbed();
        };
        this.addChild(this.btnRob);

        ViewUtils.multiLang(this, this.bg1, ...this.grids, ...this.prices, this.btnGoBack, this.btnRob);
    }

    private onCancel;
    private onSel;
    private onRob;
    private onRobbed;
    private autoCloseOnRob;
    public async open(items, prices, onBuy, onRob, autoCloseOnRob:boolean, onRobbed):Promise<void> {
        this.items = Utils.map(items, (it) => !it ? undefined : ElemFactory.create(it));
        this.items.forEach((it, i) => this.items[i] = this.soldout[i] ? undefined : this.items[i]);
        this.itemPrices = prices;
        this.onRob = onRob;
        this.onRobbed = onRobbed;
        this.autoCloseOnRob = autoCloseOnRob;
        this.refresh();

        if (this.onRob && !this.contains(this.btnRob))
            this.addChild(this.btnRob);
        else if (!this.onRob && this.contains(this.btnRob))
            this.removeChild(this.btnRob);

        return new Promise<void>((resolve, reject) => {
            this.onSel = async (n) => {
                if (!this.items[n]) {
                    AniUtils.shakeCamera(1, 100, true);
                    AniUtils.tipAt(ViewUtils.getTipText("soldout"), {x:this.width/2, y:this.height/2}, 50, 0xffffff);
                    return;
                }

                var e = this.items[n];
                var price = this.itemPrices[e.type];
                if (this.player.money - price < 0) {
                    AniUtils.shakeCamera(1, 100, true);
                    AniUtils.tipAt(ViewUtils.getTipText("notEnoughMoney"), {x:this.width/2, y:this.height/2}, 50, 0xffffff);
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

    public refreshAt(n) {
        var gd = this.grids[n];
        var i = gd["itemIndex"];
        if(gd["stars"]){
            gd["stars"].forEach((star, _) => this.removeChild(star));
            gd["stars"] = undefined;
        }
        if (!this.items[i]) {
            this.prices[i].text = "";
            ViewUtils.setTexName(gd, "soldout_png");
        } else {
            var e = this.items[i];
            this.prices[i].text = this.itemPrices[e.type];
            this.prices[i].textColor = (this.player.money - this.itemPrices[e.type]) < 0 ? 0x7d0403 : 0xffffff;
            ViewUtils.setTexName(gd, e.getElemImgRes() + "_png");
            gd.touchEnabled = true;
            if(e instanceof Relic){
                // 添加遗物等级星星
                gd["stars"] = ViewUtils.createRelicLevelStars(<Relic>e, gd);
                gd["stars"].forEach((star, _) => this.addChild(star));
            }
            // else gd["stars"] = undefined;
        }
    }

    public refresh() {        
        for (var i = 0; i < this.grids.length; i++)
            this.refreshAt(i);
    }

    async onGoBack() {
        await this.onCancel();
    }

    public static lastSelectedElemGlobalPos;
    onSelItem(evt:egret.TouchEvent) {
        var n = evt.target["itemIndex"];
        var e = this.items[n];
        this.openConfirmView(this.player, e, this.itemPrices[e.type]).then((yesno) => {
            if (yesno) {
                ShopView.lastSelectedElemGlobalPos = ViewUtils.getGlobalPosAndSize(this.grids[n]);
                this.onSel(n);
            }
        });
    }

    // 抢劫
    async doRob() {
        if (this.contains(this.btnRob))
            this.removeChild(this.btnRob);

        var es = await this.onRob(this.items);
        es.forEach(e => {
            var n = Utils.indexOf(this.items, (it) => it == e);
            Utils.assert(n >= 0 && n < this.items.length && !!this.items[n], "incorrect rob elem index:" + n);
            this.items[n] = undefined;
            this.soldout[n] = true;
        });

        if (this.autoCloseOnRob)
            await this.onCancel();
    }

    // 在指定位置上刷一个假的显示物品，做动画表现需要用
    public refreshFakeElemAt(n:number, e:Elem, price:number) {
        var gd = this.grids[n];
        var i = gd["itemIndex"];
        if (!e) {
            this.prices[i].text = "";
            ViewUtils.setTexName(gd, "soldout_png");
            gd.touchEnabled = false;
        } else {
            this.prices[i].text = price.toString();
            ViewUtils.setTexName(gd, e.getElemImgRes() + "_png");
            gd.touchEnabled = true;
        }
    }

    public getGlobaPosAndSize(n) {
        return ViewUtils.getGlobalPosAndSize(this.grids[n]);
    }

    public refreshSoldout(){
        this.soldout.forEach((b, i) => this.soldout[i] = false);
    }
}
