// 主视图
class MainView extends egret.DisplayObjectContainer {
    private p:Player; // 当前玩家数据
    public lgv:LoginView; // 主界面菜单
    public bv:BattleView; // 战斗视图
    public sv:ShopView; // 商店视图
    public hv:HospitalView; // 医院视图
    public wmv:WorldMapView; // 大地图视图
    public wmtv:WorldMapTopView; // 大地图顶部部分
    public brv:BoxRoomView; // 宝箱房间
    public ttv:TurntableView; //转盘事件
    public pluv:PlayerLevelUpView; // 角色升级界面
    public tcv:TipConfirmView; // 提示确认视图
    public gv:GuideView; // 指引层
    public rankv:RankingView; // 排行榜视图
    public idv:ElemDescView; // 怪物、遗物、物品描述视图
    public aev:AllElemsView; // 展示给定的Elems列表
    public scv:ShopConfirmView; // 遗物对比界面
    public st:SettingView; // 设置视图
    public av:AniView; // 动画层

    isInBattle:boolean; // 是否在战斗中
    
    public constructor(w:number, h:number) {
        super();
        this.width = w;
        this.height = h;

        // 动画层没有直接加入 MainView，而是被其父节点添加到最后，这样保证动画层在所有 MainView 上面
        this.av = new AniView(w, h, this);
        AniUtils.ac = this.av;
        AniUtils.aniFact = this.av.aniFact;

        // 提示确认视图
        this.tcv = new TipConfirmView(w, h);

        // 商店视图
        this.sv = new ShopView(w, h);
        this.sv.openConfirmView = async (player:Player, e:Elem, price:number, showPrice = true) => await this.openShopConfirmView(player, e, price, showPrice);

        // 战斗视图
        this.bv = new BattleView(w, h);
        this.bv.av = this.av;
        this.bv.confirmOkYesNo = async (title, content, yesno) => await this.confirmOkYesNo(title, content, yesno);

        // 宝箱房间
        this.brv = new BoxRoomView(w, h);
        this.brv.confirmOkYesNo = (title, content, yesno) => this.confirmOkYesNo(title, content, yesno);

        //转盘事件
        this.ttv = new TurntableView(w, h);

        // 角色升级界面
        this.pluv = new PlayerLevelUpView(w, h);

        // 登录界面
        this.lgv = new LoginView(w, h);

        // 设置界面
        this.st = new SettingView(w, h);
        this.st.confirmOkYesNo = (title, content, yesno) => this.confirmOkYesNo(title, content, yesno);
        this.st.openStartup = async () => {
            await this.av.blackIn();
            await this.openStartup(undefined);
        };

        // 世界地图
        this.wmv = new WorldMapView(w, h);
        this.wmv.openShop = async (shop) => await this.openShopOnWorldMap(shop);
        this.wmv.refreshShopSoldout = () => this.sv.refreshSoldout();
        this.wmv.openHospital = async () => await this.openHospital();
        this.wmv.openBoxRoom = async () => await this.openBoxRoom();
        this.wmv.openTurntable = async (turntable) => await this.openTurntable(turntable);
        this.wmv.openEventSels = async (title, desc, sels) => await this.openWorldMapEventSels(title, desc, sels);
        this.wmv.confirmOkYesNo = async (title, content, yesno) => await this.confirmOkYesNo(title, content, yesno);
        this.wmv.selRelic = async (elems, funcOnClinked, title, tip) => await this.openAllElemsView(elems, funcOnClinked, title, tip);
        this.wmv.openPlayerDieView = async () => await this.openPlayerDieView();
        this.wmtv = new WorldMapTopView(w, 80);
        this.wmtv.openSettingView = async () => await this.openSettingView();
        this.wmv.wmtv = this.wmtv;

        // 医院视图
        this.hv = new HospitalView(w, h);
        this.hv.x = this.hv.y = 0;
        this.hv.confirmOkYesNo = async (title, content, yesno) => await this.confirmOkYesNo(title, content, yesno);        
        this.hv.selRelic = async (elems, funcOnClinked, title, tip) => await this.openAllElemsView(elems, funcOnClinked, title, tip);

        // 带遗物对比的确认视图
        this.scv = new ShopConfirmView(w, h);

        // 排行榜视图
        this.rankv = new RankingView(w, h);

        // 元素描述信息视图
        this.idv = new ElemDescView(w, h);
        GridView.showElemDesc = async (e) => await this.showElemDesc(e);
        PropView.showElemDesc = async (e) => await this.showElemDesc(e);
        TurntableView.showElemDesc = async (e) => await this.showElemDesc(e);
        BoxRoomView.showElemDesc = async (e) => await this.showElemDesc(e);

        // 展示给定的Elem列表
        this.aev = new AllElemsView(w, h);
        this.aev.openCompareRelicView = async (p:Player, e:Elem, price:number, showPrice = true) => await this.openShopConfirmView(p, e, price, showPrice);
        this.aev.showElemDesc = async (e) => await this.showElemDesc(e);
        this.bv.openAllElemsView = async (elems) => await this.openAllElemsView(elems);
        this.st.openAllRelicsView = async (relics) => await this.openAllElemsView(relics);
        this.st.openAllPropsView = async (props) => await this.openAllElemsView(props);

        // 指引层
        this.gv = new GuideView(w, h, this.wmv, this.bv);

        // 录像机如何启动新的录像战斗
        BattleRecorder.startNewBattleImpl = (p:Player, btType:string, btRandomSeed:number, trueRandomSeed:number, extraLevelLogic:string[]) => {
            var bt = Battle.createNewBattle(p, btType, btRandomSeed, trueRandomSeed, extraLevelLogic);

            // 加载战斗资源
            bt.prepare();
            bt.openShop = async (items, prices, onBuy) => {}; // 录像回放中的战斗内商店特殊处理
            bt.openRelicSel2Add = async (choices, onSel) => {}; // 录像回放中的升级选择遗物特殊处理
            this.startNewBattle(bt).then(() => this.openWorldMap(p.worldmap));
        };

        // 开始一场新战斗
        this.wmv.startNewBattle = async (p:Player, btType:string, lv:number, n:number, btRandomSeed:number, skipBlackIn:boolean = false, extraLevelLogic = undefined) => { 
            if (btType[0] != "_") {
                if(Utils.checkRookiePlay())
                    btType = "rookiePlay";
                else
                    btType = btType + "_" + lv;
            }
            var bt = Battle.createNewBattle(p, btType, btRandomSeed, undefined, extraLevelLogic);

            // 加载战斗资源
            if (!skipBlackIn)
                await this.av.blackIn();

            bt.prepare();
            bt.openShop = async (items, prices, onBuy, onRob) => await this.openShopInBattle(items, prices, onBuy, onRob);
            bt.openRelicSel2Add = async (choices, onSel) => await this.openRelicSel2Add(choices, onSel);
            BattleRecorder.startNew(bt.id, bt.player, bt.btType, bt.btRandomSeed, bt.trueRandomSeed, bt.extraLevelLogic);
            await this.startNewBattle(bt);
        }

        this.isInBattle = false;
    }

    private battleEndedCallback;
    public async startNewBattle(bt:Battle) {
        Utils.log("start new battle with ", bt.btRandomSeed, bt.trueRandomSeed);

        this.bv.width = this.width;
        this.bv.height = this.height;
        this.addChild(this.bv);
        this.isInBattle = true;

        GridView.confirmOkYesNo = async (title, content, yesno) => this.confirmOkYesNo(title, content, yesno);
        GridView.selectGrid = async (f, e) => {
            this.bv.propsView.setEnabled(false);
            var pos = await this.bv.selectGrid(f, true, e);
            this.bv.propsView.setEnabled(true);
            return pos;
        };
        GridView.try2UseElem = bt.try2UseElem();
        GridView.try2UseElemAt = bt.try2UseElemAt();
        GridView.reposElemTo = bt.try2ReposElemTo();
        GridView.try2UncoverAt = bt.try2UncoverAt();
        GridView.try2BlockGrid = bt.try2BlockGrid();
        PropView.try2UseProp = bt.try2UseProp();
        PropView.try2UsePropAt = bt.try2UsePropAt();
        PropView.selectGrid = async (f, showSelectableEffect, e, helper) => await this.bv.selectGrid(f, showSelectableEffect, e, helper);

        bt.registerEvent("onPlayerOp", async (ps) => await BattleRecorder.onPlayerOp(ps.op, ps.ps));
        bt.registerEvent("onInitBattleView", async (ps) => {
            await this.bv.initBattleView(ps);
            this.bv.hideAllBanImg(true);
            await this.av.blackOut();
        });
        bt.registerEvent("onStartupRegionUncovered", async (ps) => {
            this.bv.hideAllBanImg(false);
        });
        bt.registerEvent("onPlayerDead", async () => await this.openPlayerDieView());
        Utils.registerEventHandlers(bt, [
            "onGridChanged", "onPlayerChanged", "onAttacking", "onAttacked", "onElemChanged", "onPropChanged", "onRelicChanged",
            "onElemMoving", "onElemFlying", "onElemImgFlying", "onAllCoveredAtInit", "onSuckPlayerBlood", "onMonsterTakeElem", "onBuffAdded", "onBuffRemoved",
            "onEyeDemonUncoverGrids", "onElemFloating", "canNotUseItem", "onColddownChanged", "onMonsterEatFood",
            "onAddDeathGodStep", "onElem2NextLevel", "onUseElemAt", "onUseElem", "onGoOutLevel", "onNotifyElemsDropped",
            "onCandyCannon", "onMakeWanted", "onInitBattleView", "onRelicAddElem", "onMonsterCharmed", "onCloakImmunizeSneak",
            "onSwatheItemWithCocoon", "summonByDancer", "onStartupRegionUncovered", "onSneaking", "onGoOutLevel"
        ], (e) => (ps) => this.bv.av[e](ps));
        bt.registerEvent("onBattleEnded", async (ps) => {
            await this.av.blackIn();
            this.isInBattle = false;
            this.removeChild(this.bv);            
            this.battleEndedCallback(bt);
            await this.av.blackOut();
        });
        bt.registerEvent("onGridChanged", async (ps) => await this.bv.monsterTip.onGridChanged(ps));

        // 新手指引
        this.gv.registerEvents(bt);

        BattleRecorder.registerReplayIndicatorHandlers(bt);
        bt.start();
        return new Promise<Battle>((resolve, reject) => this.battleEndedCallback = resolve);
    }

    clear() {
        var uis = [this.lgv, this.bv, this.wmv, this.wmtv, this.sv];
        for (var ui of uis)
            if (this.contains(ui))
                this.removeChild(ui);

        this.av.clear();
        egret.Tween.removeAllTweens();
    }

    // 开启商店界面
    public async openShopInBattle(items, prices, onBuy, onRob) {
        this.sv.player = this.p;
        this.addChild(this.sv);
        await this.sv.open(items, prices, onBuy, onRob, true);
        this.removeChild(this.sv);
    }

    // 打开升级选择要添加的遗物界面
    public async openRelicSel2Add(choices, onSel) {
        if (choices.length == 0)
            return;

        this.pluv.player = this.p;
        this.addChild(this.pluv);
        if (!this.isInBattle)
            this.setChildIndex(this.wmtv, -1);
        var sel = await this.pluv.open(choices);
        this.removeChild(this.pluv);
        await onSel(sel);
    }

    // 世界地图上开启商店界面
    public async openShopOnWorldMap(shop) {
        this.sv.player = this.p;
        this.addChild(this.sv);
        this.setChildIndex(this.wmtv, -1);
        var r = Utils.genRandomShopItems(this.p, shop, this.p.playerRandom, 6);

        // 处理打折
        var onOpenShopPs = {discount:0};
        this.p.triggerLogicPointSync("onOpenShop", onOpenShopPs);
        if(onOpenShopPs.discount != 0){
            var discounted = [];
            for (var item of r.items){
                if(Utils.indexOf(discounted, (i) => i == item) < 0){
                    r.prices[item] = Math.ceil(r.prices[item] * (1 - onOpenShopPs.discount / 100));
                    discounted.push(item);
                }
            }
        }
        
        var robbed = false;
        var robbedElems = [];
        var onBuy = async (elem:Elem, price:number) => {
            this.p.addMoney(-price);
            this.p.addItem(elem);
            await this.p.fireEvent("onGetMoneyInWorldmap", {dm:-price, reason:"shop"});
            this.sv.refresh();
            await this.p.fireEvent("onGetElemInWorldmap", {e:elem, fromPos:ShopView.lastSelectedElemGlobalPos});
        };

        var onRob = async (elems) => {
            // 抢劫逻辑
            Utils.assert(!robbed, "can only be robbed one time");
            robbed = true;
            var shopCfg = GCfg.getShopCfg(shop);
            var robCfg = GCfg.getRobCfg(shopCfg.rob);
            var es = Utils.doRobInShop(elems, robCfg, this.p.playerRandom);
            for (var i = 0; i < es.length; i++) {
                var e = es[i];
                this.p.addItem(e);
                var n = Utils.indexOf(r.items, (it) => it == e.type);
                ShopView.lastSelectedElemGlobalPos = this.sv.getGlobaPosAndSize(n);
                this.sv.refreshFakeElemAt(n, undefined, 0);
                await this.p.fireEvent("onGetElemInWorldmap", {e:e, price:r.prices[n], fromPos:ShopView.lastSelectedElemGlobalPos});
            }

            robbedElems = es;
            return es;
        };

        await this.sv.open(r.items, r.prices, onBuy, undefined /*robbed ? undefined : onRob*/, false);
        this.removeChild(this.sv);
    }

    // 打开医院界面
    public async openHospital() {
        this.hv.player = this.p;
        this.addChild(this.hv);
        this.setChildIndex(this.wmtv, -1);
        await this.hv.openHospital();
        this.removeChild(this.hv);
    }

    // 打开宝箱房间
    public async openBoxRoom() {
        this.brv.player = this.p;
        this.addChild(this.brv);
        this.setChildIndex(this.wmtv, -1);
        await this.brv.open();
        this.removeChild(this.brv);
    }

    // 打开转盘界面
    public async openTurntable(turntable) {
        this.ttv.player = this.p;
        var res = ["TreasureBox_png", "Coins9_png"]
        for(var reward of turntable){
            if (reward.type == "item" || reward.type == "box"){
                var rdpElems = GCfg.getRandomDropGroupCfg(reward.attrs).elems;
                for (var dpe in rdpElems){
                    res.push(dpe + "_png");
                }
            }
        }
        this.addChild(this.ttv);
        this.setChildIndex(this.wmtv, -1);
        await this.ttv.open();
        this.removeChild(this.ttv);
    }

    // 打开选项事件界面
    lastWmesv:WorldMapEventSelsView;
    public async openWorldMapEventSels(title, desc, sels) {
        if (this.lastWmesv)
            this.removeChild(this.lastWmesv);
        
        // 大地图选项事件视图
        var wmesv = new WorldMapEventSelsView(this.width, this.height);
        wmesv.x = wmesv.y = 0;
        wmesv.player = this.p;
        this.addChild(wmesv);
        this.setChildIndex(this.wmtv, -1);
        this.lastWmesv = wmesv;
        await wmesv.open(title, desc, sels);

        this.lastWmesv = undefined;
        if (this.contains(wmesv))
            this.removeChild(wmesv);
    }

    // 开启世界地图
    public openWorldMap(worldmap:WorldMap) {
        this.clear();

        this.addChild(this.wmv);
        this.addChild(this.wmtv);

        this.wmtv.player = this.p;
        this.wmtv.refresh();

        this.wmv.player = this.p;
        this.wmv.setWorldMap(worldmap);
    }

    // 登录
    public async doLoginAndGetRank() {
        var retry = true;
        while (retry) {
            var r = await platform.login();

            if (!r.ok)
                retry = await this.confirmOkYesNo(undefined, "连接服务器失败", true, {yes:"retry", no:"cancel"});
            else
                return r;
        }

        return undefined;
    }

    // 开启初始登录界面
    public async openStartup(p:Player) {
        this.clear();

        this.p = p;
        this.lgv.player = p;
        this.addChild(this.lgv);
        this.lgv.open();
        await this.av.blackOut();        
        this.lgv.onClose = async (op:string) => {
            if (op == "openRank")
                this.openRankView();
            else {
                await this.av.blackIn();
                this.removeChild(this.lgv);

                if (op == "continuePlay")
                    await this.continuePlay();
                else if (op == "newPlay") {
                    if(Utils.checkRookiePlay())
                        await this.rookiePlay();
                    else {
                        this.newPlay();
                        this.wmv.mapScrollPos = 0;
                        await this.av.blackOut();
                        await this.av.doWorldMapSlide(1);
                    }
                }
            }
        };
    }

    // 打开角色死亡界面
    public async openPlayerDieView() {
        Utils.savePlayer(undefined);
        await this.confirmOkYesNo("<font color=#7d0403 size=30>不幸死亡</font>", "<font color=#000000 size=20>有些情况你也许可以复活</font>", false);
        this.p = undefined;
        await this.av.blackIn();
        await this.openStartup(undefined);
    }

    // 显示元素描述信息
    public async showElemDesc(e:Elem) {
        this.addChild(this.idv);
        if (!this.isInBattle)
            this.setChildIndex(this.wmtv, -1);
        this.idv.player = this.p;
        await this.idv.open(e);
        this.removeChild(this.idv);
    }

    // yesno
    public async confirmOkYesNo(title, content, yesno:boolean, btnText = {}) {
        btnText = Utils.merge({"yes":"yes", "no":"cancel", "ok":"ok"}, btnText);
        return await this.tcv.confirmOkYesNo(title, content, yesno, btnText);
    }

    public async openShopConfirmView(player:Player, e:Elem, price:number, showPrice = true){
        this.addChild(this.scv);
        if (!this.isInBattle)
            this.setChildIndex(this.wmtv, -1);
        var yesno = await this.scv.open(player, e, price, showPrice);
        this.removeChild(this.scv);
        return yesno;
    }

    // ranking
    public async openRankView() {
        var r = await this.doLoginAndGetRank();
        if (!r) return;

        this.rankv.usrInfo = r.usr;
        this.rankv.weeklyRankInfo = r.rank;
        this.rankv.roleRankInfo = undefined;

        this.addChild(this.rankv);
        await this.rankv.open();
        this.removeChild(this.rankv);
    }

    // all relics view
    public async openAllElemsView(elems:Elem[], funcOnClinked = undefined, title:string = undefined, tip:string = undefined) {
        this.addChild(this.aev);
        if (!this.isInBattle)
            this.setChildIndex(this.wmtv, -1);
        this.aev.player = this.p;
        var sel = await this.aev.open(elems, funcOnClinked, title, tip);
        this.removeChild(this.aev);
        return sel;
    }

    // 打开设置界面
    public async openSettingView() {
        this.st.player = this.p;
        this.addChild(this.st);
        this.setChildIndex(this.wmtv, -1);
        await this.st.open();
        this.removeChild(this.st);
    }

    // 按照本地存档继续游戏
    async continuePlay() {
        if (!this.p) return;

        this.registerPlayerEvents();

        // 自动设置大地图位置
        this.openWorldMap(this.p.worldmap);
        var p = this.p.currentStoreyPos.lv / this.p.worldmap.nodes.length;
        this.wmv.mapScrollPos = p;

        if (this.p.currentStoreyPos.status == "finished") {
            await this.av.blackOut();
        }
        else {
            var lv = this.p.currentStoreyPos.lv;
            var n = this.p.currentStoreyPos.n;
            this.wmv.enterNode(lv, n, true);

            // 这里需要根据节点类型特别补一个 blackOut，战斗类型因为有自己不同的流程，
            // 会在战斗开始时 blackOut，所以不需要
            var nodeType = this.wmv.worldmap.nodes[lv][n].roomType;
            if (!Utils.contains(["normal", "senior", "boss"], nodeType))
                await this.av.blackOut();
        }
    }

    // 开始新游戏，本地存档被新游戏覆盖
    newPlay() {
        var p = Player.createTestPlayer();
        p = Occupation.makeOccupation(p);
        p.worldmap = WorldMap.buildFromConfig("world1", p);
        this.p = p;
        this.registerPlayerEvents();
        this.openWorldMap(p.worldmap);
        Utils.savePlayer(p);
    }

    // 新手指引
    rookiePlay() {
        var p = Player.createTestPlayer();
        p = Occupation.makeOccupation(p);
        p.worldmap = WorldMap.buildFromConfig("world1", p);
        this.p = p;
        this.registerPlayerEvents();

        var node = Utils.filter(p.worldmap.nodes[1], (n:WorldMapNode) => n.parents.length > 0)[0];
        this.openWorldMap(this.p.worldmap);
        this.wmv.mapScrollPos = 1; // 自动定位到第一层
        this.wmv.enterNode(node.y, node.x, true);
    }

    registerPlayerEvents() {
        Utils.registerEventHandlers(this.p, [
            "onGetElemInWorldmap", "onGetMoneyInWorldmap", "onGetHpInWorldmap", "onGetHpMaxInWorldmap",
            "onHospitalCureStart", "onHospitalCureEnd"
        ], (e) => (ps) => this.bv.av[e](ps));
    }
}
