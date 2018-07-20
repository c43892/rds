// 主视图
class MainView extends egret.DisplayObjectContainer {
    private p:Player; // 当前玩家数据
    public bv:BattleView; // 战斗视图
    public sv:ShopView; // 商店视图
    public hv:HospitalView; // 医院视图
    public wmv:WorldMapView; // 大地图视图
    public rsv:RelicSelView; // 遗物选择视图
    public brv:BoxRoomView; // 宝箱房间
    public ttv:TurntableView; //转盘事件
    public pluv:PlayerLevelUpView; // 角色升级界面
    public mm:egret.DisplayObjectContainer; // 主界面菜单
    public tcv:TipConfirmView; // 提示确认视图
    public rankv:RankingView; // 排行榜视图
    
    public constructor(w:number, h:number) {
        super();
        this.width = w;
        this.height = h;

        // 提示确认视图
        this.tcv = new TipConfirmView(w, h);
        this.tcv.x = this.tcv.y = 0;
        this.addChild(this.tcv);

        // 商店视图
        this.sv = new ShopView(w, h);
        this.sv.x = this.sv.y = 0;
        this.sv.confirmOkYesNo = (title, yesno) => this.confirmOkYesNo(title, yesno);

        // 遗物选择视图
        this.rsv = new RelicSelView(w, h);
        this.rsv.x = this.rsv.y = 0;
        this.rsv.confirmOkYesNo = (title, yesno) => this.confirmOkYesNo(title, yesno);

        // 战斗视图
        this.bv = new BattleView(w, h);
        this.bv.x = this.bv.y = 0;
        this.bv.openShop = async (shop, onBuy, refreshItems) => await this.openShop(shop, onBuy, refreshItems);
        this.bv.openPlayerLevelUpSels = async () => await this.openPlayerLevelUpSels();

        // 宝箱房间
        this.brv = new BoxRoomView(w, h);
        this.brv.x = this.brv.y = 0;

        //转盘事件
        this.ttv = new TurntableView(w, h);
        this.ttv.x = this.ttv.y = 0;

        // 角色升级界面
        this.pluv = new PlayerLevelUpView(w, h);
        this.pluv.x = this.pluv.y = 0;

        // 世界地图
        this.wmv = new WorldMapView(w, h);
        this.wmv.x = this.wmv.y = 0;
        this.wmv.openShop = async (shop) => await this.openShopOnWorldMap(shop);
        this.wmv.openHospital = async () => await this.openHospital();
        this.wmv.openBoxRoom = async (openBoxRoom) => await this.openBoxRoom(openBoxRoom);
        this.wmv.openTurntable = async () => await this.openTurntable();
        this.wmv.openEventSels = async (title, desc, sels) => await this.openWorldMapEventSels(title, desc, sels);
        this.wmv.confirmOkYesNo = (title, yesno) => this.confirmOkYesNo(title, yesno);
        this.wmv.selRelic = (title, f) => this.openSelRelic(title, f);
        this.wmv.openPlayerDieView = () => this.openPlayerDieView();

        // 医院视图
        this.hv = new HospitalView(w, h);
        this.hv.x = this.hv.y = 0;
        this.hv.confirmOkYesNo = (title, yesno) => this.confirmOkYesNo(title, yesno);
        this.hv.selRelic = (title, f) => this.openSelRelic(title, f);

        // 排行榜视图
        this.rankv = new RankingView(w, h);

        // 主界面菜单
        this.mm = new egret.DisplayObjectContainer();
        this.mm.x = this.mm.y = 0;
        this.mm.width = this.width;
        this.mm.height = this.height;
        var btnContinue = ViewUtils.createBitmapByName("continuePlay_png");
        btnContinue.x = (this.mm.width - btnContinue.width) / 2;
        btnContinue.y = this.mm.height / 2 - btnContinue.height - 50;
        btnContinue.touchEnabled = true;
        btnContinue.name = "continuePlay";
        this.mm.addChild(btnContinue);
        var btnNew = ViewUtils.createBitmapByName("newPlay_png");
        btnNew.x = btnContinue.x;
        btnNew.y = btnContinue.y + btnNew.height + 100;
        btnNew.touchEnabled = true;
        btnNew.name = "newPlay";
        this.mm.addChild(btnNew);

        btnContinue.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onContinuePlay, this);
        btnNew.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onNewPlay, this);

        // 录像机如何启动新的录像战斗
        BattleRecorder.startNewBattleImpl = (p:Player, btType:string, btRandomSeed:number, trueRandomSeed:number) => {
            this.startNewBattle(Battle.createNewBattle(p, btType, btRandomSeed, trueRandomSeed));
        };

        this.wmv.startNewBattle = async (p:Player, btType:string, lv:number, n:number, btRandomSeed:number) => { 
            if (btType[0] != "_") btType = btType + "_" + lv;
            var bt = Battle.createNewBattle(p, btType, btRandomSeed);
            await this.startNewBattleWithRecorder(bt);
        }
    }

    // 开始一场新的战斗
    public async startNewBattleWithRecorder(bt:Battle)
    {
        BattleRecorder.startNew(bt.id, bt.player, bt.btType, bt.btRandomSeed, bt.trueRandomSeed);
        await this.startNewBattle(bt);
    }
    private battleEndedCallback;
    public async startNewBattle(bt:Battle) {
        Utils.log("start new battle with ", bt.btRandomSeed, bt.trueRandomSeed);

        this.bv.width = this.width;
        this.bv.height = this.height;
        this.addChild(this.bv);

        ElemView.try2UseElem = bt.try2UseElem();
        ElemView.try2UseElemAt = bt.try2UseElemAt();
        ElemView.reposElemTo = bt.try2ReposElemTo();
        ElemView.selectGrid = (f, cb) => this.bv.selectGrid(f).then(cb);
        ElemView.select1InN = (title, choices, f, cb) => this.bv.select1inN(title, choices, f).then(cb);
        ElemView.try2UncoverAt = bt.try2UncoverAt();
        ElemView.try2BlockGrid = bt.try2BlockGrid();
        PropView.try2UseProp = bt.try2UseProp();
        PropView.selectGrid = (f, cb) => this.bv.selectGrid(f).then(cb);
        PropView.select1InN = (title, choices, f, cb) => this.bv.select1inN(title, choices, f).then(cb);
        PropView.try2UsePropAt = bt.try2UsePropAt();

        bt.registerEvent("onPlayerOp", (ps) => BattleRecorder.onPlayerOp(ps.op, ps.ps));
        bt.registerEvent("onLevel", (ps) => this.bv.onLevel(ps));
        bt.registerEvent("onPlayerChanged", (ps) => this.bv.onPlayerChanged(ps));
        bt.registerEvent("onOpenShop", (ps) => this.bv.onOpenShop(ps));
        bt.registerEvent("onPlayerDead", () => this.openPlayerDieView());
        Utils.registerEventHandlers(bt, [
            "onGridChanged", "onPlayerChanged", "onAttack", "onElemChanged", "onPropChanged",
            "onElemMoving", "onElemFlying", "onAllCoveredAtInit", "onSuckPlayerBlood", "onMonsterTakeElem",
        ], (e) => (ps) => this.bv.aniView[e](ps));
        bt.registerEvent("onLevel", (ps) => {
            if (ps.subType != "goOutLevel")
                return;

            this.removeChild(this.bv);
            this.battleEndedCallback(bt);
        })

        BattleRecorder.registerReplayIndicatorHandlers(bt);
        bt.Start();
        return new Promise<Battle>((resolve, reject) => this.battleEndedCallback = resolve);
    }

    clear() {
        var uis = [this.mm, this.bv, this.wmv, this.sv];
        for (var ui of uis)
            if (this.contains(ui))
                this.removeChild(ui);
    }

    // 开启商店界面
    public async openShop(shop, onBuy, refreshItems:boolean = true) {
        await this.openRanking();
        this.sv.player = this.p;
        this.addChild(this.sv);
        await this.sv.open(shop, this.p.playerRandom, onBuy, refreshItems);
        this.removeChild(this.sv);
    }

    // 世界地图上开启商店界面
    public async openShopOnWorldMap(shop) {
        await this.openShop(shop, (elem:Elem) => this.p.addItem(elem));
    }

    // 打开医院界面
    public async openHospital() {
        this.hv.player = this.p;
        this.addChild(this.hv);
        await this.hv.openHospital();
        this.removeChild(this.hv);
    }

    // 打开宝箱房间
    public async openBoxRoom(dropCfg) {
        this.brv.player = this.p;
        this.addChild(this.brv);
        await this.brv.open(dropCfg);
        this.removeChild(this.brv);
    }

    // 打开转盘界面
    public async openTurntable() {
        this.ttv.player = this.p;
        this.addChild(this.ttv); 
        this.setChildIndex(this.ttv, -1);
        await this.ttv.open();
        this.removeChild(this.ttv);
    }

    // 打开升级界面
    public async openPlayerLevelUpSels() {
        this.pluv.player = this.p;
        this.addChild(this.pluv);
        await this.pluv.open(GCfg.playerCfg.levelUpChoices);
        this.removeChild(this.pluv);
    }

    // 打开选项事件界面
    public async openWorldMapEventSels(title, desc, sels) {
        // 大地图选项事件视图
        var wmesv = new WorldMapEventSelsView(this.width, this.height);
        wmesv.x = wmesv.y = 0;
        wmesv.player = this.p;
        this.addChild(wmesv);
        await wmesv.open(title, desc, sels);
        this.removeChild(wmesv);
    }

    // 开启世界地图
    public openWorldMap(worldmap:WorldMap) {
        this.clear();
        this.wmv.player = this.p;
        this.wmv.setWorldMap(worldmap);
        this.addChild(this.wmv);
    }

    // 开启初始界面
    public openStartup(p:Player = undefined) {
        var btnNew = this.mm.getChildByName("newPlay");
        var btnContinue = this.mm.getChildByName("continuePlay");
        btnNew.touchEnabled = true;
        if (!p) {
            btnContinue.touchEnabled = false;
            ViewUtils.makeGray(btnContinue);
        } else {
            btnContinue.touchEnabled = true;
            ViewUtils.makeGray(btnContinue, false);
        }

        this.clear();
        this.p = p;
        this.addChild(this.mm);
    }

    // 打开选择遗物界面
    public async openSelRelic(title, f) {
        this.rsv.player = this.p;
        this.addChild(this.rsv);
        var sel = await this.rsv.open(title, f);
        this.removeChild(this.rsv);
        return sel;
    }

    // 打开角色死亡界面
    public async openPlayerDieView() {
        Utils.savePlayer(undefined);
        await this.confirmOkYesNo("不幸死亡", false);
        this.p = undefined;
        this.openStartup(undefined);
    }

    // yesno
    public async confirmOkYesNo(title, yesno) {
        this.setChildIndex(this.tcv, -1);
        return await this.tcv.confirmOkYesNo(title, yesno);
    }

    // ranking
    public async openRanking() {
        this.addChild(this.rankv);
        await this.rankv.open();
        this.removeChild(this.rankv);
    }

    onContinuePlay(evt:egret.TouchEvent) {
        if (this.p.currentStoreyPos.status == "finished")
            this.openWorldMap(this.p.worldmap);
        else {
            var lv = this.p.currentStoreyPos.lv;
            var n = this.p.currentStoreyPos.n;
            this.openWorldMap(this.p.worldmap);
            this.wmv.enterNode(lv, n);
        }
    }

    onNewPlay(evt:egret.TouchEvent) {
        var p = Player.createTestPlayer();
        p.worldmap = WorldMap.buildFromConfig("world1");
        p.worldmap.player = p;
        this.p = p;
        this.openWorldMap(p.worldmap);
        Utils.savePlayer(p);
    }
}
