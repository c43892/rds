// 主视图
class MainView extends egret.DisplayObjectContainer {
    private p:Player; // 当前玩家数据
    public lgv:LoginView; // 主界面菜单
    public bv:BattleView; // 战斗视图
    public sv:ShopView; // 商店视图
    public hv:HospitalView; // 医院视图
    public wmv:WorldMapView; // 大地图视图
    // public rsv:RelicSelView; // 遗物选择视图
    public brv:BoxRoomView; // 宝箱房间
    public ttv:TurntableView; //转盘事件
    public pluv:PlayerLevelUpView; // 角色升级界面
    public tcv:TipConfirmView; // 提示确认视图
    public rankv:RankingView; // 排行榜视图
    public idv:ElemDescView; // 怪物、遗物、物品描述视图
    public aev:AllElemsView; // 展示给定的Elems列表
    public st:SettingView; // 设置视图
    public av:AniView; // 动画层
    
    public constructor(w:number, h:number) {
        super();
        this.width = w;
        this.height = h;

        // 提示确认视图
        this.tcv = new TipConfirmView(w, h);

        // 商店视图
        this.sv = new ShopView(w, h);

        // // 遗物选择视图
        // this.rsv = new RelicSelView(w, h);
        // this.rsv.confirmOkYesNo = (title, content, yesno) => this.confirmOkYesNo(title, content, yesno);

        // 战斗视图
        this.bv = new BattleView(w, h);
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
        this.st.openStartup = () => this.openStartup(undefined);

        // 世界地图
        this.wmv = new WorldMapView(w, h);
        this.wmv.openShop = async (shop) => await this.openShopOnWorldMap(shop);
        this.wmv.openHospital = async () => await this.openHospital();
        this.wmv.openBoxRoom = async (openBoxRoom) => await this.openBoxRoom(openBoxRoom);
        this.wmv.openTurntable = async (turntable) => await this.openTurntable(turntable);
        this.wmv.openEventSels = async (title, desc, sels) => await this.openWorldMapEventSels(title, desc, sels);
        this.wmv.confirmOkYesNo = async (title, content, yesno) => await this.confirmOkYesNo(title, content, yesno);
        this.wmv.selRelic = async (elems, funcOnClinked, title, tip) => await this.openAllElemsView(elems, funcOnClinked, title, tip);
        this.wmv.openPlayerDieView = async () => await this.openPlayerDieView();
        this.wmv.openSettingView = async () => await this.openSettingView();

        // 医院视图
        this.hv = new HospitalView(w, h);
        this.hv.x = this.hv.y = 0;
        this.hv.confirmOkYesNo = async (title, content, yesno) => await this.confirmOkYesNo(title, content, yesno);        
        this.hv.selRelic = async (elems, funcOnClinked, title, tip) => await this.openAllElemsView(elems, funcOnClinked, title, tip);

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
        this.aev.confirmOkYesNo = async (title, content, yesno) => await this.confirmOkYesNo(title, content, yesno);
        AllElemsView.showElemDesc = async (e) => await this.showElemDesc(e);
        this.bv.openAllElemsView = async (elems) => await this.openAllElemsView(elems);
        this.st.openAllRelicsView = async (relics) => await this.openAllElemsView(relics);
        this.st.openAllPropsView = async (props) => await this.openAllElemsView(props);

        // 动画层
        this.av = new AniView(w, h, this);
        // 动画层没有直接加如 MainView，而是被其父节点添加到最后，这样保证动画层在所有 MainView 上面
        this.bv.av = this.av;
        AniUtils.ac = this.bv.av;
        AniUtils.aniFact = this.bv.av.aniFact;

        // 录像机如何启动新的录像战斗
        BattleRecorder.startNewBattleImpl = (p:Player, btType:string, btRandomSeed:number, trueRandomSeed:number) => {
            var bt = Battle.createNewBattle(p, btType, btRandomSeed, trueRandomSeed);

            // 加载战斗资源
            bt.prepare();
            this.loadBattleRes(bt).then(() => {
                bt.openShop = async (items, prices, onBuy) => {}; // 录像回放中的战斗内商店特殊处理
                bt.openRelicSel2Add = async (choices, onSel) => {}; // 录像回放中的升级选择遗物特殊处理
                this.startNewBattle(bt).then(() => this.openWorldMap(p.worldmap));
            })
        };

        // 开始一场新战斗
        this.wmv.startNewBattle = async (p:Player, btType:string, lv:number, n:number, btRandomSeed:number) => { 
            if (btType[0] != "_") btType = btType + "_" + lv;
            var bt = Battle.createNewBattle(p, btType, btRandomSeed);

            // 加载战斗资源
            bt.prepare();
            await this.loadBattleRes(bt);

            bt.openShop = async (items, prices, onBuy, onRob) => await this.openShopInBattle(items, prices, onBuy, onRob);
            bt.openRelicSel2Add = async (choices, onSel) => await this.openRelicSel2Add(choices, onSel);
            BattleRecorder.startNew(bt.id, bt.player, bt.btType, bt.btRandomSeed, bt.trueRandomSeed);
            await this.startNewBattle(bt);
        }
    }

    private battleEndedCallback;
    public async startNewBattle(bt:Battle) {
        Utils.log("start new battle with ", bt.btRandomSeed, bt.trueRandomSeed);

        this.bv.width = this.width;
        this.bv.height = this.height;
        this.addChild(this.bv);

        GridView.try2UseElem = bt.try2UseElem();
        GridView.try2UseElemAt = bt.try2UseElemAt();
        GridView.reposElemTo = bt.try2ReposElemTo();
        GridView.selectGrid = (f, cb) => this.bv.selectGrid(f).then(cb);
        GridView.confirmOkYesNo = async (title, content, yesno) => this.confirmOkYesNo(title, content, yesno);
        GridView.try2UncoverAt = bt.try2UncoverAt();
        GridView.try2BlockGrid = bt.try2BlockGrid();
        PropView.try2UseProp = bt.try2UseProp();
        PropView.selectGrid = (f, cb) => this.bv.selectGrid(f).then(cb);
        PropView.confirmOkYesNo = async (title, content, yesno) => this.confirmOkYesNo(title, content, yesno);
        PropView.try2UsePropAt = bt.try2UsePropAt();

        bt.registerEvent("onPlayerOp", async (ps) => await BattleRecorder.onPlayerOp(ps.op, ps.ps));
        bt.registerEvent("onLevelInited", async (ps) => await this.bv.initBattleView(ps));
        bt.registerEvent("onPlayerDead", async () => await this.openPlayerDieView());
        Utils.registerEventHandlers(bt, [
            "onGridChanged", "onPlayerChanged", "onAttacking", "onAttacked", "onElemChanged", "onPropChanged", "onRelicChanged",
            "onElemMoving", "onElemFlying", "onAllCoveredAtInit", "onSuckPlayerBlood", "onMonsterTakeElem", "onBuffAdded",
            "onEyeDemonUncoverGrids", "onElemFloating", "canNotUseItem", "onColddownChanged", "onMonsterEatFood",
            "onAddDeathGodStep", "onElem2NextLevel", "onUseElemAt", "onUseElem", "onGoOutLevel", "onNotifyElemsDropped",
            "onCandyCannon", "onMakeWanted",
        ], (e) => (ps) => this.bv.av[e](ps));
        bt.registerEvent("onBattleEnded", async (ps) => {
            this.removeChild(this.bv);
            this.battleEndedCallback(bt);
        });
        bt.registerEvent("onGridChanged", async (ps) => await this.bv.monsterTip.onGridChanged(ps));

        BattleRecorder.registerReplayIndicatorHandlers(bt);
        bt.start();
        return new Promise<Battle>((resolve, reject) => this.battleEndedCallback = resolve);
    }

    clear() {
        var uis = [this.lgv, this.bv, this.wmv, this.sv];
        for (var ui of uis)
            if (this.contains(ui))
                this.removeChild(ui);
    }

    // 开启商店界面
    public async openShopInBattle(items, prices, onBuy, onRob) {
        this.sv.player = this.p;
        await this.loadResources(Utils.map(Utils.filter(items, (it) => !!it), (it) => it + "_png"));
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
        var sel = await this.pluv.open(choices);
        this.removeChild(this.pluv);
        onSel(sel);
    }

    // 世界地图上开启商店界面
    public async openShopOnWorldMap(shop) {
        this.sv.player = this.p;
        this.addChild(this.sv);
        var r = Utils.genRandomShopItems(this.p, shop, this.p.playerRandom, 6);
        await this.loadResources(Utils.map(Utils.filter(r.items, (it) => !!it), (it) => it + "_png"));

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
            this.sv.refresh();
            await this.p.fireEvent("onGetElemInWorldmap", {e:elem, price:price, fromPos:ShopView.lastSelectedElemGlobalPos});
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

        await this.sv.open(r.items, r.prices, onBuy, robbed ? undefined : onRob, false);
        this.removeChild(this.sv);
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
        await this.loadResources(res);
        this.addChild(this.ttv); 
        this.setChildIndex(this.ttv, -1);
        await this.ttv.open();
        this.removeChild(this.ttv);
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

    // 登录
    public async doLoginAndGetRank() {
        var retry = true;
        while (retry) {
            var r = await platform.login();

            if (!r.ok)
                retry = await this.confirmOkYesNo(undefined, "连接服务器失败", true, {yes:"重试", no:"取消"});
            else
                return r;
        }

        return undefined;
    }

    // 开启初始登录界面
    public openStartup(p:Player) {
        this.clear();

        this.p = p;
        this.lgv.player = p;
        this.addChild(this.lgv);
        this.lgv.refresh();
        this.lgv.onClose = (op:string) => {
            if (op == "openRank")
                this.openRankView();
            else {
                this.removeChild(this.lgv);
                if (op == "continuePlay")
                    this.continuePlay();
                else if (op == "newPlay")
                    this.newPlay();
            }
        };
    }

    // // 打开选择遗物界面
    // public async openSelRelic(title, f) {
    //     this.rsv.player = this.p;
    //     this.addChild(this.rsv);
    //     var sel = await this.rsv.open(title, f);
    //     this.removeChild(this.rsv);
    //     return sel;
    // }

    // 打开角色死亡界面
    public async openPlayerDieView() {
        Utils.savePlayer(undefined);
        await this.confirmOkYesNo("不幸死亡", "有些情况也许你能复活", false);
        this.p = undefined;
        this.openStartup(undefined);
    }

    // 显示元素描述信息
    public async showElemDesc(e:Elem) {
        this.addChild(this.idv);
        this.setChildIndex(this.idv, -1);
        this.idv.player = this.p;
        await this.idv.open(e);
        this.removeChild(this.idv);
    }

    // yesno
    public async confirmOkYesNo(title, content, yesno:boolean, btnText = {}) {
        btnText = Utils.merge({"yes":"yes", "no":"cancel", "ok":"ok"}, btnText);
        return await this.tcv.confirmOkYesNo(title, content, yesno, btnText);
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
        this.setChildIndex(this.aev, -1);
        this.aev.player = this.p;
        var sel = await this.aev.open(elems, funcOnClinked, title, tip);
        this.removeChild(this.aev);
        return sel;
    }

    // 打开设置界面
    public async openSettingView() {
        this.st.player = this.p;
        this.addChild(this.st);
        this.setChildIndex(this.st, -1);
        await this.st.open();
        this.removeChild(this.st);
    }

    // 加载指定资源组并显示加载画面
    public loadResGroupsImpl;
    public loadResGroups = async (g) => await this.loadResGroupsImpl(g);
    public async loadResources(resArr) {
        // 将所有需要加载的资源打包成要给临时资源组
        var r = new SRandom();
        var g = "resourcegroup_" + r.nextDouble().toString();
        RES.createGroup(g, resArr);
        await this.loadResGroups(g);
    }

    // 加载指定关卡中配置到的资源
    public async loadBattleRes(bt:Battle) {
        var resArr = [];

        // 所有已经加入的元素
        var items:string[] = Utils.map(bt.level.map.findAllElems(), (e) => e.type);
        var relics:string[] = Utils.map(bt.player.relics, (r) => r.type);
        var props:string[] = Utils.map(bt.player.props, (r) => r.type);
        var es = [...items, ...relics, ...props];
        while (es.length > 0) {
            var e = es.shift();
            var cfg = bt.level.getElemCfg(e);
            Utils.assert(!!cfg, "no elem config: " + e);
            var attrs = cfg.attrs;
            var type = cfg.type;
            
            var res = attrs.elemImg ? attrs.elemImg : type;
            if (!attrs.invisible) {
                if (attrs.repRes) {
                    for (var r of attrs.repRes)
                        resArr.push(r + "_png");
                } else
                    resArr.push(res + "_png");
            }

            if (attrs.refElems) {
                for (var re of attrs.refElems)
                    es.push(re);
            }

            // 固定掉落元素
            var dpElems = attrs.dropItems ? attrs.dropItems : [];
            for (var dpe of dpElems)
                es.push(dpe);

            // 随机掉落组
            var rdpElems = attrs.rdp ? GCfg.getRandomDropGroupCfg(attrs.rdp).elems : {};
            for (var dpe1 in rdpElems)
                es.push(dpe1);
        }

        await this.loadResources(resArr);
    }

    // 按照本地存档继续游戏
    continuePlay() {
        if (!this.p) return;

        this.registerPlayerEvents();
        if (this.p.currentStoreyPos.status == "finished")
            this.openWorldMap(this.p.worldmap);
        else {
            var lv = this.p.currentStoreyPos.lv;
            var n = this.p.currentStoreyPos.n;
            this.openWorldMap(this.p.worldmap);
            this.wmv.enterNode(lv, n);
        }
    }

    // 开始新游戏，本地存档被新游戏覆盖
    newPlay() {
        var p = Player.createTestPlayer();
        p = Occupation.makeOccupation(p);
        p.worldmap = WorldMap.buildFromConfig("world1");
        p.worldmap.player = p;
        this.p = p;
        this.registerPlayerEvents();
        this.openWorldMap(p.worldmap);
        Utils.savePlayer(p);
    }

    registerPlayerEvents() {
        Utils.registerEventHandlers(this.p, [
            "onGetElemInWorldmap", "onGetMoneyInWorldmap"
        ], (e) => (ps) => this.bv.av[e](ps));
    }
}
