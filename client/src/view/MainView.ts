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

        // 录像机如何启动新的录像战斗
        BattleRecorder.startNewBattleImpl = (p:Player, trueRandomSeed:number) => {
            this.startNewBattle(Battle.createNewBattle(p, trueRandomSeed));
        };

        // 如何启动下一关战斗
        Battle.startNewBattle = (p:Player) => {
            p.currentLevel = GCfg.getLevelCfg(p.currentLevel).nextLevel;
            this.startNewBattleWithRecorder(Battle.createNewBattle(p));
        }
    }

    public startTestBattle() {
        // test map
        var bt = Battle.createNewBattle(Player.createTestPlayer());
        this.startNewBattleWithRecorder(bt);
    }
    
    public bv:BattleView; // 战斗视图
    public sv:ShopView; // 商店视图
    public wmv:WorldMapView; // 大地图视图

    // 开始一场新的战斗
    public startNewBattleWithRecorder(bt:Battle) { this.startNewBattle(bt); BattleRecorder.startNew(bt.id, bt.player, bt.trueRandomSeed); }
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

        BattleRecorder.registerReplayIndicatorHandlers(bt);
        bt.Start();
    }

    // 开启商店界面
    public openShop() {

    }

    // 开启世界地图
    public openWorldMap() {
        this.addChild(this.wmv);
    }
}
