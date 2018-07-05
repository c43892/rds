// 主视图
class MainView extends egret.DisplayObjectContainer {
    private p:Player; // 当前玩家数据
    public bv:BattleView; // 战斗视图
    public sv:ShopView; // 商店视图
    public hv:HospitalView; // 医院视图
    public wmv:WorldMapView; // 大地图视图
    public rsv:RelicSelView; // 遗物选择视图
    public mm:egret.DisplayObjectContainer; // 主界面菜单
    public tcv:TipConfirmView; // 提示确认视图
    
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
        this.sv.confirmYesNo = async (title) => {
            this.setChildIndex(this.tcv, -1);
            return await this.tcv.confirmYesNo(title);
        };

        // 遗物选择视图
        this.rsv = new RelicSelView(w, h);
        this.rsv.x = this.rsv.y = 0;
        this.rsv.confirmYesNo = async (title) => {
            this.setChildIndex(this.tcv, -1);
            return await this.tcv.confirmYesNo(title);
        };

        // 战斗视图
        this.bv = new BattleView(w, h);
        this.bv.x = this.bv.y = 0;
        this.bv.openShop = async (shop, autoClose) => await this.openShop(shop, autoClose);

        // 世界地图
        this.wmv = new WorldMapView(w, h);
        this.wmv.x = this.wmv.y = 0;
        this.wmv.openShop = async (shop) => await this.openShop(shop, false);
        this.wmv.openHospital = async () => await this.openHospital();

        // 医院视图
        this.hv = new HospitalView(w, h);
        this.hv.x = this.hv.y = 0;
        this.hv.confirmYesNo = async (title) => {
            this.setChildIndex(this.tcv, -1);
            return await this.tcv.confirmYesNo(title);
        };
        this.hv.selRelic = async (title, f) => {
            this.rsv.player = this.p;
            this.addChild(this.rsv);
            var sel = await this.rsv.open(title, f);
            this.removeChild(this.rsv);
            return sel;
        };

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
        BattleRecorder.startNewBattleImpl = (p:Player, btType:string, trueRandomSeed:number) => {
            this.startNewBattle(Battle.createNewBattle(p, btType, trueRandomSeed));
        };

        this.wmv.startNewBattle = async (p:Player, lv:number, n:number) => { 
            var btType = p.worldmap.stories[lv][n];
            var bt = Battle.createNewBattle(p, btType + "_" + lv);
            await this.startNewBattleWithRecorder(bt);
        }
    }

    // 开始一场新的战斗
    public async startNewBattleWithRecorder(bt:Battle) { await this.startNewBattle(bt); BattleRecorder.startNew(bt.id, bt.player, bt.btType, bt.trueRandomSeed); }
    private battleEndedCallback;
    public async startNewBattle(bt:Battle) {
        Utils.log("start new battle with ", bt.$$srandSeed());

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
        Utils.registerEventHandlers(bt, [
            "onGridChanged", "onPlayerChanged", "onAttack", "onElemChanged", "onPropChanged",
            "onElemMoving", "onAllCoveredAtInit", "onSuckPlayerBlood", "onMonsterTakeElem",
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
    public async openShop(shop, autoClose:boolean = true) {
        this.sv.player = this.p;
        this.addChild(this.sv);
        await this.sv.open(shop, autoClose);
        this.removeChild(this.sv);
    }

    // 打开医院界面
    public async openHospital() {
        this.hv.player = this.p;
        this.addChild(this.hv);
        await this.hv.openHospital();
        this.removeChild(this.hv);
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

     onContinuePlay(evt:egret.TouchEvent) {
        if (this.p.currentStoreyPos.status == "finished")
            this.openWorldMap(this.p.worldmap);
        else {
            var lv = this.p.currentStoreyPos.lv;
            var n = this.p.currentStoreyPos.n;
            this.wmv.startNewBattle(this.p, lv, n);
        }
     }

     onNewPlay(evt:egret.TouchEvent) {
        var p = Player.createTestPlayer();
        p.worldmap = WorldMap.buildFromConfig("world1");
        p.worldmap.player = p;
        this.p = p;
        this.openWorldMap(p.worldmap);
     }
}
