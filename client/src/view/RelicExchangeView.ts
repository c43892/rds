class RelicExchangeView extends egret.DisplayObjectContainer{
    public player:Player;
    private bg:egret.Bitmap;
    private bg1:egret.Bitmap;
    private titleEquipped:egret.TextField;
    private relicsArea:egret.DisplayObjectContainer;
    private equippedGrids:egret.DisplayObjectContainer[] = [];
    private inBagGrids:egret.DisplayObjectContainer[] = [];
    private relicsAreaBg:egret.Bitmap;
    private leftSplitLine:egret.Bitmap;
    private rightSplitLine:egret.Bitmap;
    private titleInBag:egret.TextField;
    private pageUpBtn:TextButtonWithBg;
    private pageDownBtn:TextButtonWithBg;
    private goBackBtn:TextButtonWithBg;
    private goOnBtn:TextButtonWithBg;
    private page:number;
    private rsEquipped:Relic[];
    private rsInBag:Relic[];
    private canDrag:boolean;
    private funcOnClick:string;
    public showDescView;
    public confirmOkYesNo;
    public relicConfirmView;
    

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

        this.leftSplitLine = ViewUtils.createBitmapByName("leftSplitLine_png");
        this.leftSplitLine.name = "leftSplitLine";

        this.rightSplitLine = ViewUtils.createBitmapByName("leftSplitLine_png");
        this.rightSplitLine.scaleX = -1;
        this.rightSplitLine.name = "rightSplitLine";

        this.pageUpBtn = new TextButtonWithBg("pageUpBtn_png", 30);
        this.pageUpBtn.name = "pageUpBtn";
        this.pageUpBtn.onClicked = () => this.pageUp();

        this.pageDownBtn = new TextButtonWithBg("pageUpBtn_png", 30);
        this.pageDownBtn.name = "pageDownBtn";
        this.pageDownBtn.bg.scaleX = -1;
        this.pageDownBtn.onClicked = () => this.pageDown();

        this.goBackBtn = new ArrowButton(false, "goBack_png", 30);
        this.goBackBtn.name = "goBackBtn";
        this.goBackBtn.text = ViewUtils.getTipText("goBackBtn");
        this.goBackBtn.touchEnabled = true;
        this.goBackBtn.onClicked = () => this.goBack();

        this.goOnBtn = new ArrowButton(true, "goForward_png", 30);
        this.goOnBtn.name = "goOnBtn";
        this.goOnBtn.text = ViewUtils.getTipText("saveExchange");
        this.goOnBtn.touchEnabled = true;
        this.goOnBtn.onClicked = () => this.goOn();

        var objs = [this.bg1, this.titleEquipped, this.titleInBag, this.leftSplitLine, this.rightSplitLine, this.goBackBtn, this.goOnBtn, this.pageUpBtn, this.pageDownBtn, this.relicsArea];
        objs.forEach((obj, _) => this.addChild(obj));
        ViewUtils.multiLang(this, ...objs);

        this.relicsAreaBg = new egret.Bitmap();
        this.relicsAreaBg.width = this.relicsArea.width;
        this.relicsAreaBg.height = this.relicsArea.height;
        var rev = this;
        this.relicsAreaBg.addEventListener(egret.TouchEvent.TOUCH_MOVE, (evt) => RelicExchangeView.onEvent(rev, "onTouchMove", evt), this.relicsAreaBg);
        this.relicsAreaBg.touchEnabled = true;
        this.relicsAreaBg.name = "this.relicsAreaBg";
        this.relicsArea.addChild(this.relicsAreaBg);

        this.setEmptyGrids();
    }

    public async open(canDrag:boolean = true, funcOnClick = "showDesc", hideGoBackBtn = false) {
        this.canDrag = canDrag;
        this.funcOnClick = funcOnClick;
        this.page = 0;
        this.rsEquipped = [...this.player.relicsEquipped];
        this.rsInBag = [...this.player.relicsInBag];
        // 处理返回和前进按钮
        if (!this.canDrag){
            this.goOnBtn.alpha = 0;
            this.goOnBtn.touchEnabled = false;
        } else {
            this.goOnBtn.alpha = 1;
            this.goOnBtn.touchEnabled = true;
        }
        if (hideGoBackBtn){
            this.goBackBtn.alpha = 0;
            this.goBackBtn.touchEnabled = false;
        } else {
            this.goBackBtn.alpha = 1;
            this.goBackBtn.touchEnabled = true;
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
        if (this.rsInBag.length > this.ShowNum * (this.page + 1)) {
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
                grid.x = x;
                grid.y = y;
                grid.touchEnabled = true;
                let noElemImg = ViewUtils.createBitmapByName("aevNoElem_png");
                noElemImg.anchorOffsetX = noElemImg.width / 2;
                noElemImg.anchorOffsetY = noElemImg.height / 2;
                noElemImg.x = grid.x + this.GridSize / 2;
                noElemImg.y = grid.y + this.GridSize / 2;
                this.relicsArea.addChild(noElemImg);
                this.relicsArea.addChild(grid);

                var rev = this;
                grid.addEventListener(egret.TouchEvent.TOUCH_BEGIN, (evt) => RelicExchangeView.onEvent(rev, "onTouchBegin", evt), grid);
                grid.addEventListener(egret.TouchEvent.TOUCH_MOVE, (evt) => RelicExchangeView.onEvent(rev, "onTouchMove", evt), grid);
                grid.addEventListener(egret.TouchEvent.TOUCH_END, (evt) => RelicExchangeView.onEvent(rev, "onTouchEnd", evt), grid);
                grid.addEventListener(egret.TouchEvent.TOUCH_RELEASE_OUTSIDE, (evt) => RelicExchangeView.onEvent(rev, "onTouchEnd", evt), grid);
                grid.name = j + "grid" + i;

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
    private refreshGrids(relics: Relic[] = [], equipped:boolean) {
        if (equipped)
            var containerArr = this.equippedGrids;
        else
            var containerArr = this.inBagGrids;

        for (var i = 0; i < this.ShowNum; i++) {
            var container = containerArr[i];
            container.removeChildren();
            container["index"] = i;
            // 该index是遗物
            if (i < relics.length && relics[i]) {
                var r = relics[i];
                container["elem"] = "relicAndStar";
                container["relic"] = r;
                container["arr"] = equipped ? this.rsEquipped : this.rsInBag;
                var relicImg = ViewUtils.createBitmapByName(r.getElemImgRes() + "_png");
                var stars = ViewUtils.createRelicLevelStars(r, relicImg);
                container.addChild(relicImg);
                stars.forEach((star, _) => container.addChild(star));
            }
            // 该index没有遗物了,如果是装备着的,需要显示空格或锁
            else if (equipped) {
                container["relic"] = undefined;
                container["arr"] = this.rsEquipped;
                if (i < this.player.relicsEquippedCapacity){
                    container["elem"] = "emptyGrid";
                    var emptyGridBg = new egret.Bitmap();
                    emptyGridBg.width = emptyGridBg.height = this.GridSize;
                    container.addChild(emptyGridBg);
                }
                else if (i >= this.player.relicsEquippedCapacity) {
                    container["relic"] = undefined;
                    container["elem"] = "lock";                    
                    var l = ViewUtils.createBitmapByName("relicLock_png");
                    l.anchorOffsetX = l.width / 2;
                    l.anchorOffsetY = l.height / 2;
                    l.x = container.width / 2;
                    l.y = container.height / 2;
                    container.addChild(l);
                }
            }
            // 背包中的显示空格
            else{
                container["elem"] = "emptyGrid";
                container["relic"] = undefined;
                container["arr"] = this.rsInBag;
                var emptyGridBg = new egret.Bitmap();
                emptyGridBg.width = emptyGridBg.height = this.GridSize;
                container.addChild(emptyGridBg);
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
        if (!this.canDrag) 
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
    static longPressed:boolean = false; 
    static pressTimer:egret.Timer
    static longPressThreshold = 500;
    static dragLimit = 1600; // 判断为拖动的距离
    static dragging: boolean = false; // 产生拖拽事件
    static draggingImg: egret.Bitmap; // 拖拽中的图片
    static draggingImgTex: egret.RenderTexture; //拖动图片的动态纹理
    static dragFromImg: egret.Bitmap;
    static dragFromPos;

    static eventArr = []; // 等待响应的事件列
    static onEvent(rev, eventType:string, evt:egret.TouchEvent) {
        RelicExchangeView.eventArr.push({rev:rev, eventType:eventType, evt:evt})
        if (RelicExchangeView.eventArr.length == 1)
            RelicExchangeView.startEvent();
    }

    static async startEvent() {
        while(RelicExchangeView.eventArr.length > 0){
            let event = RelicExchangeView.eventArr[0];
            let rev = event.rev;
            let eventType:string = event.eventType;
            let evt:egret.TouchEvent = event.evt;
            if (!evt.target){ // 操作系统的差异可能导致evt.target为空,则忽略此事件
                // Utils.log("get undefined evt.target at " + eventType);
                RelicExchangeView.eventArr.shift();
            } else {
                // Utils.log(evt.target.name);
                await rev[eventType](evt);
                RelicExchangeView.eventArr.shift();
                if (eventType == "onTouchEnd")
                    RelicExchangeView.eventArr = [];                
            }
        }
    }

    async onTouchBegin(evt: egret.TouchEvent) {
        RelicExchangeView.pressed = true;
        RelicExchangeView.dragging = false;
        RelicExchangeView.dragFromImg = evt.target;
        RelicExchangeView.dragFromPos = { x: evt.localX + evt.target.x, y: evt.localY + evt.target.y };

        if (!RelicExchangeView.pressTimer){
            RelicExchangeView.pressTimer = new egret.Timer(RelicExchangeView.longPressThreshold, 1);
            RelicExchangeView.pressTimer.addEventListener(egret.TimerEvent.TIMER, RelicExchangeView.onPressTimer, this);
        }
        RelicExchangeView.pressTimer.start();
    }

    static async onPressTimer(evt:egret.TimerEvent) {
        if (!RelicExchangeView.pressed) return;
        RelicExchangeView.longPressed = true;
        RelicExchangeView.pressTimer.stop();
        // 暂时没有长按响应
        RelicExchangeView.pressed = false;
        RelicExchangeView.longPressed = false;
    }

    async onTouchMove(evt: egret.TouchEvent) {
        if (RelicExchangeView.longPressed) return;

        if (!(RelicExchangeView.dragFromImg && RelicExchangeView.dragFromImg["elem"] == "relicAndStar")) return;

        var currentX = evt.localX + evt.target.x;
        var currentY = evt.localY + evt.target.y;
        if (!RelicExchangeView.dragging) {
            var dx = currentX - RelicExchangeView.dragFromPos.x;
            var dy = currentY - RelicExchangeView.dragFromPos.y;
            if (dx * dx + dy * dy > RelicExchangeView.dragLimit) {
                RelicExchangeView.dragging = true;
                RelicExchangeView.pressed = false;
                if (!this.canDrag) return;
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
                RelicExchangeView.draggingImg.x = currentX;
                RelicExchangeView.draggingImg.y = currentY;
                // 开始拖拽后原有的图片消失
                RelicExchangeView.dragFromImg.alpha = 0;
            }
        }
        else {
            if (!this.canDrag) return;
            RelicExchangeView.draggingImg.x = currentX;
            RelicExchangeView.draggingImg.y = currentY;
        }
    }

    async onTouchEnd(evt: egret.TouchEvent) {
        if (RelicExchangeView.dragging && RelicExchangeView.dragFromImg && RelicExchangeView.dragFromImg["elem"] == "relicAndStar") {            
            // 在不允许拖动的界面上拖动遗物时需要给出提示
            if (!this.canDrag)
                await AniUtils.tipAt(ViewUtils.getTipText("tipOnDrag"), {x:this.width/2, y:this.height/2});
            else {
                this.relicsArea.removeChild(RelicExchangeView.draggingImg);
                RelicExchangeView.dragFromImg.alpha = 1;

                // 拖动技能到另一个技能的位置, 则交换两个技能的位置.
                if (evt.target["elem"] == "relicAndStar") {
                    var from = RelicExchangeView.dragFromImg;
                    var to = evt.target;
                    // 如果拖动中存在背包中的遗物,其grids index不等于relics index,因为存在翻页
                    var fromIndex = from["arr"] == this.rsInBag ? from["index"] + this.page * this.ShowNum : from["index"];
                    var toIndex = to["arr"] == this.rsInBag ? to["index"] + this.page * this.ShowNum : to["index"];
                    from["arr"][fromIndex] = to["relic"];
                    to["arr"][toIndex] = from["relic"];
                    this.refresh();
                }
                // 拖动技能到空的技能格
                else if (evt.target["elem"] == "emptyGrid") {
                    var from = RelicExchangeView.dragFromImg;
                    var to = evt.target;
                    var fromBag = from["arr"] == this.rsInBag;
                    var toBag = to["arr"] == this.rsInBag;
                    // 技能从原有数组移除
                    if (fromBag) 
                        this.rsInBag = Utils.remove(this.rsInBag, from["relic"]);                    
                    else 
                        this.rsEquipped = Utils.remove(this.rsEquipped, from["relic"]);
                    
                    // 技能添加到新数组
                    if (toBag)
                        this.rsInBag.push(from["relic"]);                    
                    else 
                        this.rsEquipped.push(from["relic"]);

                    // 被拖动的技能的目标位置
                    var target = toBag ? this.inBagGrids[this.rsInBag.length - this.page * this.ShowNum - 1] : this.equippedGrids[this.rsEquipped.length - 1];
                    // 如果拖动到的最终位置不是目标位置,需要一个飞到目标位置的动画
                    if (target != to) {
                        from.alpha = 0;
                        // 创建用于动画的图片relicAndStarImg
                        // 将技能和星星装在一个DisplayObjectContainer内后绘制纹理
                        var relic = <Relic>from["relic"];
                        var relicImg = ViewUtils.createBitmapByName(relic.getElemImgRes() + "_png");
                        var stars = ViewUtils.createRelicLevelStars(relic, relicImg);
                        var relicAndStar = new egret.DisplayObjectContainer();
                        relicAndStar.addChild(relicImg);
                        stars.forEach((star, _) => relicAndStar.addChild(star));
                        var relicAndStarTex = new egret.RenderTexture();
                        relicAndStarTex.drawToTexture(relicAndStar);
                        var relicAndStarImg = AniUtils.createImg("");
                        relicAndStarImg.texture = relicAndStarTex;
                        relicAndStarImg.width = relicAndStarTex.textureWidth;
                        relicAndStarImg.height = relicAndStarTex.textureHeight;

                        var fromImg = AniUtils.ani2global(to);
                        var toPos = AniUtils.ani2global(target);
                        relicAndStarImg.x = fromImg.x;
                        relicAndStarImg.y = fromImg.y;
                        this.refresh();
                        from.alpha = 1;
                        target.alpha = 0;
                        await AniUtils.flyAndFadeout(relicAndStarImg, toPos, 200, 1, 1, 0, egret.Ease.quintOut);
                        relicAndStarImg["dispose"]();
                        target.alpha = 1;
                    }
                    else {
                        this.refresh();
                        from.alpha = 1;
                    }
                }
            }
            RelicExchangeView.dragging = false;
        }
        else if (RelicExchangeView.pressed) {
            RelicExchangeView.pressed = false;
            switch (this.funcOnClick) {
                case "showDesc": {
                    if (RelicExchangeView.dragFromImg["elem"] == "relicAndStar")
                        await this.showDescView(RelicExchangeView.dragFromImg["relic"]);
                    break;
                }
                case "selectRelic": {
                    if (RelicExchangeView.dragFromImg["elem"] == "relicAndStar") {
                        var r:Relic = RelicExchangeView.dragFromImg["relic"];
                        if (r.canReinfoce()){
                            var reinforceRelic = ElemFactory.create(r.type);
                            var yesno = await this.relicConfirmView(this.player, reinforceRelic, undefined, false);
                            if (yesno) 
                                this.doClose(r);
                        } else {
                            await AniUtils.tipAt(ViewUtils.getTipText("tipOnCannotReinfoce"), {x:this.width/2, y:this.height/2});
                        }
                        break;
                    }
                }
            }
        }
        RelicExchangeView.dragFromImg = undefined;
        RelicExchangeView.dragFromPos = undefined;
    }

    // 保存遗物交换操作
    savePlayerRelicExchange() {
        this.player.changeRelicPosition(this.rsEquipped, this.rsInBag);
    }
}