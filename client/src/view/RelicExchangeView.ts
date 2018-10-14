class RelicExchangeView extends egret.DisplayObjectContainer{
    public player:Player;
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private titleEquipped:egret.TextField;
    private relicsArea:egret.DisplayObjectContainer;
    private equippedGrids:egret.DisplayObjectContainer[] = [];
    private inBagGrids:egret.DisplayObjectContainer[] = [];
    private relicsAreaBg:egret.Bitmap;
    private titleInBag:egret.TextField;
    private pageUpBtn:TextButtonWithBg;
    private pageDownBtn:TextButtonWithBg;
    private goBackBtn:TextButtonWithBg;
    private goOnBtn:TextButtonWithBg;
    private page:number;
    private rsEquipped:Relic[];
    private rsInBag:Relic[];
    private forView:boolean;
    public showDescView;
    public confirmOkYesNo;

    constructor(w, h) {
        super();

        this.name = "relicExchange";
        this.width = w;
        this.height = h;

        this.bg = ViewUtils.createBitmapByName("translucent_png");
        this.bg.x = 0;
        this.bg.y = 0;
        this.bg.width = w;
        this.bg.height = h;
        this.bg.touchEnabled = true;
        this.addChild(this.bg);

        this.bg1 = ViewUtils.createBitmapByName("bigBg_png");
        this.bg1.name = "bg1";

        this.titleEquipped = ViewUtils.createTextField(45, 0x7d0403);
        this.titleEquipped.text = ViewUtils.getTipText("titleEquipped");
        this.titleEquipped.name = "titleEquipped";

        this.relicsArea = new egret.DisplayObjectContainer();
        this.relicsArea.name = "relicsArea";

        this.titleInBag = ViewUtils.createTextField(45, 0x7d0403);
        this.titleInBag.text = ViewUtils.getTipText("titleInBag");
        this.titleInBag.name = "titleInBag";

        this.pageUpBtn = new TextButtonWithBg("moreRelicsBtn_png", 30);
        this.pageUpBtn.name = "pageUpBtn";
        this.pageUpBtn.onClicked = () => this.pageUp();

        this.pageDownBtn = new TextButtonWithBg("moreRelicsBtn_png", 30);
        this.pageDownBtn.name = "pageDownBtn";
        this.pageDownBtn.bg.scaleX = -1;
        this.pageDownBtn.onClicked = () => this.pageDown();

        this.goBackBtn = new TextButtonWithBg("goBack_png", 30);
        this.goBackBtn.name = "goBackBtn";
        this.goBackBtn.text = ViewUtils.getTipText("goBackBtn");
        this.goBackBtn.touchEnabled = true;
        this.goBackBtn.onClicked = () => this.goBack();

        this.goOnBtn = new TextButtonWithBg("goForward_png", 30);
        this.goOnBtn.name = "goOnBtn";
        this.goOnBtn.text = ViewUtils.getTipText("continueBtn");
        this.goOnBtn.touchEnabled = true;
        this.goOnBtn.onClicked = () => this.goOn();

        var objs = [this.bg1, this.titleEquipped, this.titleInBag, this.goBackBtn, this.goOnBtn, this.pageUpBtn, this.pageDownBtn, this.relicsArea];
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);

        this.relicsAreaBg = new egret.Bitmap();
        this.relicsAreaBg.width = this.relicsArea.width;
        this.relicsAreaBg.height = this.relicsArea.height;
        this.relicsAreaBg.touchEnabled = true;
        this.relicsArea.addChild(this.relicsAreaBg);

        this.setEmptyGrids();
    }

    public async open(forView:boolean = false) {
        this.forView = forView;
        this.page = 0;
        this.rsEquipped = [...this.player.relicsEquipped];
        this.rsInBag = [...this.player.relicsInBag];
        if (this.forView){
            this.goOnBtn.alpha = 0;
            this.goOnBtn.touchEnabled = false;
        } else {
            this.goOnBtn.alpha = 1;
            this.goOnBtn.touchEnabled = true;
        }
        this.refresh();
        return new Promise<number>((resolve, reject) => this.doClose = resolve);
    }

    private doClose;

    private refresh() {
        this.refreshRelicEquipped();
        this.refreshRelicInBagArea();
    }

    readonly ColNum = 4; // 每一行 4 个
    readonly GridSize = 84; // 图标大小
    readonly ShowNum = 12; // 单页展示数量

    private refreshRelicEquipped() {
        this.refreshGrids(this.rsEquipped, true);
    }

    private refreshRelicInBagArea() {
        // 是否两个显示翻页按钮
        if (this.page > 0) {
            this.pageDownBtn.touchEnabled = true;
            this.pageDownBtn.alpha = 1;
        }
        else {
            this.pageDownBtn.touchEnabled = false;
            this.pageDownBtn.alpha = 0;
        }
        if (this.player.relicsInBag.length > this.ShowNum * (this.page + 1)) {
            this.pageUpBtn.touchEnabled = true;
            this.pageUpBtn.alpha = 1;
        }
        else {
            this.pageUpBtn.touchEnabled = false;
            this.pageUpBtn.alpha = 0;
        }

        var relics = [];
        this.rsInBag.forEach((relic, index) => {
            if (index >= this.page * this.ShowNum && index < (this.page + 1) * this.ShowNum)
                relics.push(relic);
        })
        this.refreshGrids(relics, false);
    }

    // 在背景上放置圆盘和用于装入遗物图的格子
    private setEmptyGrids() {
        for (var j = 0; j < 2; j++) {
            // j == 0, 装备着的.  j == 1, 背包里的.
            var space = (this.relicsArea.width - (this.ColNum * this.GridSize)) / (this.ColNum + 1);
            var x = space;
            var y = j == 0 ? (space - 25) : (space - 25 + 380);
            for (var i = 0; i < this.ShowNum; i++) {
                var grid = new egret.DisplayObjectContainer();
                grid.width = grid.height = this.GridSize;
                grid.anchorOffsetX = grid.width / 2;
                grid.anchorOffsetY = grid.height / 2;
                grid.x = x + this.GridSize / 2;
                grid.y = y + this.GridSize / 2;
                grid.touchEnabled = true;
                let noElemImg = ViewUtils.createBitmapByName("aevNoElem_png");
                noElemImg.anchorOffsetX = noElemImg.width / 2;
                noElemImg.anchorOffsetY = noElemImg.height / 2;
                noElemImg.x = grid.x;
                noElemImg.y = grid.y;
                this.relicsArea.addChild(noElemImg);
                this.relicsArea.addChild(grid);

                grid.addEventListener(egret.TouchEvent.TOUCH_BEGIN, (evt) => this.onTouchBegin(evt), grid);
                grid.addEventListener(egret.TouchEvent.TOUCH_MOVE, (evt) => this.onTouchMove(evt), grid);
                grid.addEventListener(egret.TouchEvent.TOUCH_END, (evt) => this.onTouchEnd(evt), grid);
                grid.addEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, (evt) => this.onTouchEnd(evt), grid);

                if (j == 0)
                    this.equippedGrids.push(grid);
                else
                    this.inBagGrids.push(grid);

                x += this.GridSize + space;
                if (x >= this.relicsArea.width) {
                    x = space;
                    y += this.GridSize + space;
                }
            }
        }
    }

    // 刷新格子里的遗物图像等,只刷新装备的或背包里的12个格子
    private refreshGrids(relics: Relic[] = [], equipped) {
        if (equipped)
            var containerArr = this.equippedGrids;
        else
            var containerArr = this.inBagGrids;

        for (var i = 0; i < this.ShowNum; i++) {
            var container = containerArr[i];
            container.removeChildren();
            if (i < relics.length) {
                var r = relics[i];
                var relicAndStar = new egret.DisplayObjectContainer();
                container["elem"] = "relicAndStar";
                container["relic"] = r;
                container["arr"] = equipped ? this.rsEquipped : this.rsInBag;
                container.addChild(relicAndStar);
                var relicImg = ViewUtils.createBitmapByName(r.getElemImgRes() + "_png");
                var stars = ViewUtils.createRelicLevelStars(r, relicImg);
                relicAndStar.addChild(relicImg);
                stars.forEach((star, _) => relicAndStar.addChild(star));
            }
            else if (i >= relics.length && equipped) {
                container["elem"] = "lock";
                container["relic"] = undefined;
                container["arr"] = undefined;
                var l = ViewUtils.createBitmapByName("relicLock_png");
                l.width = l.height = this.GridSize;
                container.addChild(l);
            }
            else{
                container["elem"] = undefined;
                container["relic"] = undefined;
                container["arr"] = undefined;
            }
        }
    }

    pageUp() {
        this.page++;
        this.refreshRelicInBagArea();
    }

    pageDown() {
        this.page--;
        this.refreshRelicInBagArea();
    }

    async goBack() {
        if (this.forView) 
            this.doClose(-1);        
        else {
            var yesno = await this.confirmOkYesNo(ViewUtils.getTipText("makeSureGiveUpTitle"), ViewUtils.getTipText("makeSureGiveUpContent"), true);
            if (yesno) 
                this.doClose(-1);            
        }
    }

    async goOn() {
        var yesno = await this.confirmOkYesNo(ViewUtils.getTipText("makeSureGoOnTitle"), ViewUtils.getTipText("makeSureGoOnContent"), true);
        if (yesno) {
            this.savePlayerRelicExchange();
            this.doClose(1);
        }
    }

    static pressed: boolean = false; // 按下,未开始拖拽
    static dragLimit = 100; // 判断为拖动的距离
    static dragging: boolean = false; // 产生拖拽事件
    static draggingImg: egret.Bitmap; // 拖拽中的图片
    static draggingImgTex: egret.RenderTexture; //拖动图片的动态纹理
    static dragFromImg: egret.Bitmap;
    static dragFromPos;

    async onTouchBegin(evt: egret.TouchEvent) {
        RelicExchangeView.pressed = true;
        RelicExchangeView.dragging = false;
        RelicExchangeView.dragFromImg = evt.target;
        RelicExchangeView.dragFromPos = { x: evt.localX + evt.target.x, y: evt.localX + evt.target.y };
    }

    async onTouchMove(evt: egret.TouchEvent) {
        if (this.forView || !RelicExchangeView.dragFromImg || RelicExchangeView.dragFromImg["elem"] != "relicAndStar") return;

        var currentX = evt.localX + evt.target.x;
        var currentY = evt.localY + evt.target.y;
        if (!RelicExchangeView.dragging) {
            var dx = currentX - RelicExchangeView.dragFromPos.x;
            var dy = currentY - RelicExchangeView.dragFromPos.y;
            if (dx * dx + dy * dy > RelicExchangeView.dragLimit) {
                RelicExchangeView.dragging = true;
                if (!RelicExchangeView.draggingImg)
                    RelicExchangeView.draggingImg = new egret.Bitmap();

                this.relicsArea.addChild(RelicExchangeView.draggingImg);

                if (!RelicExchangeView.draggingImgTex)
                    RelicExchangeView.draggingImgTex = new egret.RenderTexture();

                // 新的拖拽需要更新拖动图片的纹理
                RelicExchangeView.draggingImgTex.drawToTexture(RelicExchangeView.dragFromImg);
                RelicExchangeView.draggingImg.texture = RelicExchangeView.draggingImgTex;
                RelicExchangeView.draggingImg.anchorOffsetX = RelicExchangeView.draggingImg.width / 2;
                RelicExchangeView.draggingImg.anchorOffsetY = RelicExchangeView.draggingImg.height / 2;
                RelicExchangeView.draggingImg.x = currentX - RelicExchangeView.draggingImg.width / 2;
                RelicExchangeView.draggingImg.y = currentY - RelicExchangeView.draggingImg.height / 2;
                // 开始拖拽后原有的图片消失
                RelicExchangeView.dragFromImg.alpha = 0;
            }
        }
        else {
            RelicExchangeView.draggingImg.x = currentX - RelicExchangeView.draggingImg.width / 2;
            RelicExchangeView.draggingImg.y = currentY - RelicExchangeView.draggingImg.height / 2;
        }
    }

    async onTouchEnd(evt: egret.TouchEvent) {
        if (RelicExchangeView.dragging) {
            RelicExchangeView.dragging = false;
            this.relicsArea.removeChild(RelicExchangeView.draggingImg);
            RelicExchangeView.dragFromImg.alpha = 1;
            if (evt.target["elem"] == "relicAndStar" && evt.target != RelicExchangeView.dragFromImg) {
                var from = RelicExchangeView.dragFromImg;
                var to = evt.target;
                var r1 = from["relic"];
                var index1 = Utils.indexOf(from["arr"], (r: Relic) => r == r1);
                var r2 = to["relic"];
                var index2 = Utils.indexOf(to["arr"], (r: Relic) => r == r2);
                from["arr"][index1] = r2;
                to["arr"][index2] = r1;
                this.refresh();
            }
            RelicExchangeView.dragFromImg = undefined;
            RelicExchangeView.dragFromPos = undefined;
        }
        else if (RelicExchangeView.pressed) {
            RelicExchangeView.pressed = false;
            if (RelicExchangeView.dragFromImg["elem"] == "relicAndStar")
                await this.showDescView(RelicExchangeView.dragFromImg["relic"]);
            else if (RelicExchangeView.dragFromImg["elem"] == "lock") {

            }
        }
    }

    // 保存遗物交换操作
    savePlayerRelicExchange() {
        this.rsEquipped.forEach((relic: Relic, i) => {
            if (relic == this.player.relicsEquipped[i])
                return;
            else if (Utils.indexOf(this.player.relicsEquipped, (r: Relic) => r == relic) > -1)
                return;
            else
                relic.toRelic(this.player);
        })

        this.rsInBag.forEach((relic: Relic, i) => {
            if (relic == this.player.relicsInBag[i])
                return;
            else if (Utils.indexOf(this.player.relicsInBag, (r: Relic) => r == relic) > -1)
                return;
            else
                relic.removeAllEffects();
        })

        this.player.relicsEquipped = this.rsEquipped;
        this.player.relicsInBag = this.rsInBag;
    }
}