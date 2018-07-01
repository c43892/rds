// 主视图
class MainView extends egret.DisplayObjectContainer {
    public constructor(w:number, h:number) {
        super();
        this.width = w;
        this.height = h;

        // 商店视图
        this.sv = new ShopView(w, h);
        this.sv.anchorOffsetX = 0;
        this.sv.anchorOffsetY = 0;
        this.sv.x = 0;
        this.sv.y = 0;

        // 战斗视图
        this.bv = new BattleView(w, h);
        this.bv.anchorOffsetX = 0;
        this.bv.anchorOffsetY = 0;
        this.bv.x = 0;
        this.bv.y = 0;
        this.bv.openShop = () => this.openShop();

        // 世界地图
        this.wmv = new WorldMapView(w, h);
        this.wmv.anchorOffsetX = 0;
        this.wmv.anchorOffsetY = 0;
        this.wmv.x = 0;
        this.wmv.y = 0;

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

        this.wmv.startNewBattle = (p:Player, lv:number, n:number) => { 
            var btType = p.worldmap.stories[lv][n];
            var bt = Battle.createNewBattle(p, btType + "_" + lv);
            p.notifyStoreyPosIn(lv, n);

            Utils.$$saveItem("player", p.toString());

            this.clear();
            this.addChild(this.bv);
            this.startNewBattleWithRecorder(bt);
        }
    }
    
    private p:Player; // 当前玩家数据
    public bv:BattleView; // 战斗视图
    public sv:ShopView; // 商店视图
    public wmv:WorldMapView; // 大地图视图
    public mm:egret.DisplayObjectContainer; // 主界面菜单

    // 开始一场新的战斗
    public startNewBattleWithRecorder(bt:Battle) { this.startNewBattle(bt); BattleRecorder.startNew(bt.id, bt.player, bt.btType, bt.trueRandomSeed); }
    public startNewBattle(bt:Battle) {
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

            var p = bt.player;
            p.notifyStoreyPosFinished(p.currentStoreyPos.lv, p.currentStoreyPos.n);
            Utils.$$saveItem("player", p.toString());

            this.openWorldMap(p.worldmap);
        })

        BattleRecorder.registerReplayIndicatorHandlers(bt);
        bt.Start();
    }

    clear() {
        var uis = [this.mm, this.bv, this.wmv, this.sv];
        for (var ui of uis)
            if (this.contains(ui))
                this.removeChild(ui);
    }

    // 开启商店界面
    public openShop() {

    }

    // 开启世界地图
    public openWorldMap(worldmap:WorldMap) {
        this.clear();
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
