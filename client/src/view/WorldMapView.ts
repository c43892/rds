// 大地图视图
class WorldMapView extends egret.DisplayObjectContainer {
    public player:Player;
    private viewContent:egret.DisplayObjectContainer;
    private bg1:egret.Bitmap;
    private bg2:egret.Bitmap;
    private bgc:egret.DisplayObjectContainer;
    private mapArea:egret.ScrollView;

    public wmtv:WorldMapTopView;
    public openShop; // 打开商店
    public refreshShopSoldout; // 刷新商店的销售状态
    public openHospital; // 进入医院
    public openBoxRoom; // 宝箱房间
    public openTurntable;//打开转盘事件
    public openEventSels; // 选项事件
    public confirmOkYesNo; // yesno 确认
    public selRelic; // 选择遗物
    public openPlayerDieView; // 角色死亡
    public openFinishGameView; // 通关

    private wmesFact:WorldMapEventSelFactory;

    public constructor(w, h) {
        super();
        this.width = w;
        this.height = h;
        this.name = "worldmap";

        this.bg1 = ViewUtils.createBitmapByName("WorldMapBg_png", egret.BitmapFillMode.REPEAT);
        this.bg2 = ViewUtils.createBitmapByName("WorldMapBg_png", egret.BitmapFillMode.REPEAT);
        this.bgc = new egret.DisplayObjectContainer();
        this.bgc.addChild(this.bg1);
        this.bgc.addChild(this.bg2);
        this.viewContent = new egret.DisplayObjectContainer();

        this.mapArea = new egret.ScrollView();
        this.mapArea.verticalScrollPolicy = "auto";
        this.mapArea.horizontalScrollPolicy = "off";
        this.mapArea.setContent(this.viewContent);
        this.mapArea.bounces = false;
        this.addChild(this.mapArea);

        this.touchEnabled = false;
        this.mapArea.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTouchGrid, this);

        this.wmesFact = new WorldMapEventSelFactory();
        this.wmesFact.confirmOkYesNo = this.confirmOkYesNo;
        this.wmesFact.selRelic = this.selRelic;
        this.wmesFact.openEventSelGroup = async (p:Player, group) => await this.openSelGroup(p, group);
        this.wmesFact.openSels = async (p:Player, title, desc, bg, sels) => await this.openSels(p, title, desc, bg, sels);
        this.wmesFact.openTurntable = async (turntable) => await this.openTurntable(turntable);

        this.btnSymbolDesc = new TextButtonWithBg("SymbolDescbtn_png");
        this.btnSymbolDesc.name = "btnSymbolDesc";
        this.symbolDesc = new TextButtonWithBg("SymbolDesc_png");
        this.symbolDesc.name = "symbolDesc";
    }

    btnSymbolDesc:TextButtonWithBg; // 图例按钮
    symbolDesc:TextButtonWithBg; // 图例

    private refreshUI() {
        this.refreshFrame();

        var objs = [this.btnSymbolDesc, this.symbolDesc];
        objs.forEach((obj, _) => {
            if (!this.contains(obj))
                this.addChild(obj);
        });
        ViewUtils.multiLang(this, ...objs);

        this.removeChild(this.symbolDesc); // 初始不显示图例
        this.btnSymbolDesc.onClicked = () => this.onClickSymbolDesc();
        this.symbolDesc.onClicked = () => this.onClickSymbolDesc();
        this.wmtv.refresh();
    }

    private onClickSymbolDesc() {
        if (this.contains(this.symbolDesc)) {
            this.removeChild(this.symbolDesc);
            this.addChild(this.btnSymbolDesc);
            ViewUtils.multiLang(this, this.btnSymbolDesc);
        } else {
            this.removeChild(this.btnSymbolDesc);
            this.addChild(this.symbolDesc);
            ViewUtils.multiLang(this, this.symbolDesc);
            this.btnSymbolDesc.y = this.symbolDesc.y + this.symbolDesc.height;
        }
    }

    private refreshFrame() {
        var w = this.width;
        var h = this.height;
        var topLine = 80;

        this.mapArea.width = w;
        this.mapArea.height = h;
        this.mapArea.x = 0;
        this.mapArea.y = 0;

        this.viewContent.x = 0;
        this.viewContent.y = 0;
        this.viewContent.width = w;
        this.viewContent.height = this.mapArea.height * 2 + topLine;

        this.viewContent.removeChildren();
        this.viewContent.addChild(this.bgc);
        ViewUtils.asFullBg(this.bgc);
        this.bgc.y = 0;

        this.bg1.x = 0;
        this.bg1.y = 0;
        this.bg1.width = this.bgc.width / 2;
        this.bg1.height = this.viewContent.height;

        this.bg2.x = this.bgc.width;
        this.bg2.y = 0;
        this.bg2.width = this.bgc.width / 2;
        this.bg2.height = this.viewContent.height;
        this.bg2.scaleX = -1;

        // 外框

        var xSpace = 10;
        var ySpace = 20;

        var head = ViewUtils.createBitmapByName("WorldMapBg2_png");
        head.x = this.viewContent.width / 2 - head.width;
        head.y = -15 + topLine;
        this.viewContent.addChild(head);

        var head2 = ViewUtils.createBitmapByName("WorldMapBg2_png");
        head2.x = this.viewContent.width / 2 + head.width;
        head2.y = head.y;
        head2.scaleX = -1;        
        this.viewContent.addChild(head2);

        var head3 = ViewUtils.createBitmapByName("WorldMapBg2_png");
        head3.x = head.x;
        head3.y = this.viewContent.height - (ySpace - 15);
        head3.scaleY = -1;
        this.viewContent.addChild(head3);

        var head4 = ViewUtils.createBitmapByName("WorldMapBg2_png");
        head4.x = head2.x;
        head4.y = head3.y;
        head4.scaleX = -1;
        head4.scaleY = -1;
        this.viewContent.addChild(head4);

        var clt = ViewUtils.createBitmapByName("WorldMapBgCorner_png");
        clt.x = this.viewContent.width - this.width + xSpace;
        clt.y = topLine;
        clt.scale9Grid = new egret.Rectangle(clt.width - 2, clt.height - 2, 1, 1);
        clt.width = this.width / 2 - head.width - clt.x;
        clt.height = this.viewContent.height / 2 - clt.y;
        this.viewContent.addChild(clt);

        var crt = ViewUtils.createBitmapByName("WorldMapBgCorner_png");
        crt.width = clt.width;
        crt.height = clt.height;        
        crt.scale9Grid = clt.scale9Grid;
        crt.x = this.viewContent.width / 2 + crt.width + head.width;
        crt.y = topLine;
        crt.scaleX = -1;
        this.viewContent.addChild(crt);

        var clb = ViewUtils.createBitmapByName("WorldMapBgCorner_png");
        clb.x = clt.x;
        clb.y = this.viewContent.height - ySpace;
        clb.scale9Grid = clt.scale9Grid;
        clb.width = clt.width;
        clb.height = clt.height;
        clb.scaleY = -1;
        this.viewContent.addChild(clb);

        var crb = ViewUtils.createBitmapByName("WorldMapBgCorner_png");
        crb.width = clt.width;
        crb.height = clt.height;
        crb.scale9Grid = clt.scale9Grid;
        crb.x = crt.x;
        crb.y = clb.y;
        crb.scaleX = -1;
        crb.scaleY = -1;
        this.viewContent.addChild(crb);

        var cn1 = ViewUtils.createBitmapByName("WorldMapBg1_png");
        cn1.x = clt.x + 20;
        cn1.y = clt.y + 12;
        this.viewContent.addChild(cn1);

        var cn2= ViewUtils.createBitmapByName("WorldMapBg1_png");
        cn2.x = crt.x - 20;
        cn2.y = cn1.y;
        cn2.scaleX = -1;
        this.viewContent.addChild(cn2);

        var cn3 = ViewUtils.createBitmapByName("WorldMapBg1_png");
        cn3.x = cn1.x;
        cn3.y = clb.y - 12;
        cn3.scaleY = -1;
        this.viewContent.addChild(cn3);

        var cn4 = ViewUtils.createBitmapByName("WorldMapBg1_png");
        cn4.x = cn2.x;
        cn4.y = cn3.y;
        cn4.scaleX = -1;
        cn4.scaleY = -1;
        this.viewContent.addChild(cn4);
    }

    private refreshNodes() {
        var wp = this.worldmap;

        // 显示每个节点
        var imgs = [];
        var adoptImgs = [];
        var xEdgeBlank = 100; // 节点与左右边缘留白大小
        var topGap = 50;
        var yGap = (this.viewContent.height - topGap) / wp.nodes.length;
        var xGap = (this.mapArea.width - 2 * xEdgeBlank) / (wp.cfg.width - 1);
        var xSwing = 0.2; // 节点在地图上偏离标准位置的抖动幅度
        var ySwing = 0.2;
        var dotScale = 1.2; // 节点放大

        // 遍历所有节点,将具有父节点的作为可用节点,并记录该节点的属性.
        for (var i = 0; i < wp.nodes.length; i++) {
            var y = yGap * i;
            var row = [];
            var adoptRow = [];
            for (var j = 0; j < wp.nodes[i].length; j++) {
                if(wp.nodes[i][j].parents.length != 0){
                    var pt = wp.nodes[i][j].roomType;
                    var img = ViewUtils.createBitmapByName("Node" + pt + "_png");
                    if(i == wp.nodes.length - 1){
                        img.x = (wp.nodes[i].length - 1) / 2 * xGap + xEdgeBlank;// boss点位置特殊处理
                        img.y = WorldMapNode.getNodeYposOnView(wp.nodes[i][j], this.viewContent.height, yGap, 0);
                    }else{
                        img.x = WorldMapNode.getNodeXposOnView(wp.nodes[i][j], xEdgeBlank, xGap, xSwing);
                        img.y = WorldMapNode.getNodeYposOnView(wp.nodes[i][j], this.viewContent.height, yGap, ySwing);
                    }
                    img.anchorOffsetX = img.width / 2;
                    img.anchorOffsetY = img.height / 2;
                    img["ptType"] = wp.nodes[i][j].roomType;
                    img["ptStoreyLv"] = i;
                    img["ptStoreyN"] = j;
                    img.touchEnabled = true;
                    img.scaleX = img.scaleY = 1.2;
                    img.alpha = 0.5;
                    row.push(img);

                    var adpImg = ViewUtils.createBitmapByName("Adopt_png");
                    adpImg.x = img.x;
                    adpImg.y = img.y;
                    adpImg.anchorOffsetX = adpImg.width / 2;
                    adpImg.anchorOffsetY = adpImg.height / 2;
                    adpImg.scaleX = adpImg.scaleY = dotScale;
                    adoptRow.push(adpImg);
                } else {
                    row.push(undefined);
                    adoptRow.push(undefined);
                }
            }
            imgs.push(row);
            adoptImgs.push(adoptRow);
        }

        // 遍历所有可用节点的所有边,根据边的起始节点和目标节点的坐标绘制脚印
        var allSteps = {};
        for(var i = 0; i < wp.nodes.length; i++){
            allSteps[i] = [];
            for(var j = 0; j < wp.nodes[i].length; j++){
                if (!wp.nodes[i][j]) continue;
                allSteps[i][j] = [];
                if(wp.nodes[i][j].parents.length != 0){
                    for(var k = 0; k < wp.nodes[i][j].routes.length; k++){
                        var n = wp.nodes[i][j];

                        var pt1x = imgs[i][j].x;
                        var pt1y = imgs[i][j].y;
                        var pt2x, pt2y;
                        if(i == wp.nodes.length - 2) {
                            pt2x = (wp.nodes[i].length - 1) / 2 * xGap + xEdgeBlank;
                            pt2y = WorldMapNode.getNodeYposOnView(n.routes[k].dstNode, this.viewContent.height, yGap, 0);
                        } else {
                            pt2x = WorldMapNode.getNodeXposOnView(n.routes[k].dstNode, xEdgeBlank, xGap, xSwing);
                            pt2y = WorldMapNode.getNodeYposOnView(n.routes[k].dstNode, this.viewContent.height, yGap, ySwing);
                        }

                        var pt1 = {x:pt1x, y:pt1y};
                        var pt2 = {x:pt2x, y:pt2y};
                        var dist = Utils.getDist(pt1, pt2);
                        var steps = dist / 20; // 根据距离确定步数
                        var stepsDx = (pt2x - pt1x) / steps;
                        var stepsDy = (pt2y - pt1y) / steps;
                        var stepRotation = Utils.getRotationFromTo(pt1, pt2); // 确定脚步方向

                        // 根据方向计算左右距离中心线的位置偏移
                        var dPosX1 = Math.cos((stepRotation - 90) * Math.PI / 180) * 5;
                        var dPosY1 = Math.sin((stepRotation - 90) * Math.PI / 180) * 5;
                        var dPosX2 = Math.cos((stepRotation + 90) * Math.PI / 180) * 5;
                        var dPosY2 = Math.sin((stepRotation + 90) * Math.PI / 180) * 5;

                        // 首尾让出来几步，避免盖住节点图标
                        var stepImgArr:egret.Bitmap[] = [];
                        for (var st = 2; st < steps - 1; st++) {
                            var stepImg = ViewUtils.createBitmapByName("FootPrint_png");
                            stepImg.x = pt1x + stepsDx * st + (st%2==0?dPosX1:dPosX2);
                            stepImg.y = pt1y + stepsDy * st + (st%2==0?dPosY1:dPosY2);
                            stepImg.anchorOffsetX = stepImg.width / 2;
                            stepImg.anchorOffsetY = stepImg.height / 2;
                            stepImg.rotation = stepRotation + (st%2==0?-15:15);
                            stepImg.scaleX = st%2==0?1:-1; // 左右脚印需要对称反转
                            stepImg.alpha = 0.5;
                            stepImgArr.push(stepImg);
                            this.viewContent.addChild(stepImg);
                        }

                        allSteps[i][j][k] = stepImgArr;
                    }
                    this.viewContent.addChild(imgs[i][j]);
                }
            }
        }

        // 显示可选节点动画
        var sps = BattleUtils.getSelectableStoreyPos(this.worldmap.player);
        for (var sp of sps) {
            var img:egret.Bitmap = imgs[sp.lv][sp.n];
            if (!img) continue;
            img.alpha = 1;
            var tw = egret.Tween.get(img, {loop:true});
            var w = img.width;
            var h = img.height;
            tw.to({scaleX:1.5, scaleY:1.5}, 1000, egret.Ease.quadInOut)
                .to({scaleX:dotScale, scaleY:dotScale}, 1000, egret.Ease.quadInOut);
        }

        // 显示可经过的节点
        var lastSp;
        for (var sp of this.worldmap.player.finishedStoreyPos) {
            if (!imgs[sp.lv][sp.n]) continue;
            imgs[sp.lv][sp.n].alpha = 1;
            
            // 处理脚步路径
            if (lastSp) {
                var from = lastSp;
                var to = sp;
                
                for (var k = 0; k < wp.nodes[from.lv][from.n].routes.length; k++) {
                    var kr = wp.nodes[from.lv][from.n].routes[k];
                    if (to.lv == kr.dstNode.y && to.n == kr.dstNode.x) {
                        allSteps[from.lv][from.n][k].forEach((img, _) => img.alpha = 1);
                        break;
                    }
                }
            }

            lastSp = sp;
            this.viewContent.addChild(adoptImgs[sp.lv][sp.n]);
        }

        // 处理脚步路径
        if (lastSp) {
            for (var k = 0; k < wp.nodes[lastSp.lv][lastSp.n].routes.length; k++) {
                var kr = wp.nodes[lastSp.lv][lastSp.n].routes[k];
                allSteps[lastSp.lv][lastSp.n][k].forEach((img, _) => img.alpha = 1);
            }
        }
    }

    // 设置滚动位置(0:顶部 - 1:底部)
    public set mapScrollPos(p:number) {
        var top = (this.viewContent.height - this.mapArea.height) * p;
        this.mapArea.scrollTop = top;
    }

    // 设置当前大地图滚动位置
    public get mapScrollPos() {
        return this.mapArea.scrollTop / (this.viewContent.height - this.mapArea.height);
    }

    public refresh() {
        if (!this.worldmap) return;
        this.refreshUI();
        this.refreshNodes();
    }

    worldmap:WorldMap;
    public setWorldMap(worldmap:WorldMap) {
        this.worldmap = worldmap;
        this.refresh();
    }

    public startNewBattle; // 开启一场新战斗
    onTouchGrid(evt:egret.TouchEvent) {

        var bmp = evt.target;
        if (!(bmp instanceof egret.Bitmap))
            return;

        var ptType = bmp["ptType"];
        var ptStoreyLv = bmp["ptStoreyLv"];
        var ptStoreyN = bmp["ptStoreyN"];

        //检查点击的节点是否是当前可到达节点(测试中,暂且屏蔽该检查)
        if (!DEBUG && !BattleUtils.isStoreyPosSelectable(this.worldmap.player, {lv:ptStoreyLv, n:ptStoreyN}))
            return;

        Utils.assert(this.worldmap.nodes[ptStoreyLv][ptStoreyN].roomType == ptType, 
            "worldmap storey type ruined: " + ptType + " vs " + this.worldmap.nodes[ptStoreyLv][ptStoreyN].roomType);

        this.enterNode(ptStoreyLv, ptStoreyN);
    }

    public async enterNode(lv:number, n:number, skipBlackIn:boolean = false) {
        
        // 保存进度
        this.player.notifyStoreyPosIn(lv, n);
        Utils.savePlayer(this.player);

        var nodeType = this.worldmap.nodes[lv][n].roomType;
        var p = this.worldmap.player;
        switch(nodeType) {
            case "normal":                
                var btRandonSeed = p.playerRandom.nextInt(0, 10000);
                this.refreshShopSoldout() // 刷新战斗内商店销售状态
                await this.startNewBattle(p, nodeType, lv, n, btRandonSeed, skipBlackIn);
                break;
            case "senior":
                var btRandonSeed = p.playerRandom.nextInt(0, 10000);
                this.refreshShopSoldout() // 刷新战斗内商店销售状态
                var seniorTypes = GCfg.getBattleTypes("senior");
                var seniorType = seniorTypes[this.player.playerRandom.nextInt(0, seniorTypes.length)];
                await this.startNewBattle(p, seniorType, lv, n, btRandonSeed, skipBlackIn);
                break;
            case "boss":
                var btRandonSeed = p.playerRandom.nextInt(0, 10000);
                this.refreshShopSoldout() // 刷新战斗内商店销售状态
                var bossTypes = GCfg.getBattleTypes("boss");
                var bossType = bossTypes[this.player.playerRandom.nextInt(0, bossTypes.length)];
                await this.startNewBattle(p, bossType, lv, n, btRandonSeed, skipBlackIn);
                break;
            case "shop":
                this.refreshShopSoldout() // 刷新世界地图商店销售状态
                await this.openShop(this.worldmap.cfg.shop);
                break;
            case "camp":
                await this.openHospital();
                break;
            case "box":
                await this.openBoxRoom(this.worldmap.cfg.boxroomDrops);
                break;
            case "event":
                this.refreshShopSoldout() // 刷新事件内可能出现的商店销售状态
                await this.openMapEventSels(lv, n);
                break;
            default:
                Utils.log("not support " + nodeType + " yet");
            break;
        }

        // 保存进度
        this.player.notifyStoreyPosFinished(this.player.currentStoreyPos.lv, this.player.currentStoreyPos.n);

        // 如果是新手玩家,要标记为已完成新手指引关
        if(Utils.checkRookiePlay() && lv >= 5)
            Utils.saveLocalData("rookiePlay", "finished");

        Utils.savePlayer(this.player);

        // 检查死亡
        if (this.player.isDead()) {
            await this.openPlayerDieView();
        } else {
            // 更新最高分
            window.platform.setUserCloudStorage({"score": Utils.playerFinishedStorey(this.player)});
            
            // 判断此世界是否已经完成
            if(this.player.currentStoreyPos.lv >= this.player.worldmap.cfg.totalLevels){
                this.player.finishedWorldMap.push(this.worldmap.cfg.name);
                var newtWorldName = this.worldmap.cfg.nextWorld;
                if(newtWorldName){
                    var newWorld = WorldMap.buildFromConfig(newtWorldName, this.player);
                    this.player.goToNewWorld(newWorld);
                    this.setWorldMap(p.worldmap);
                    await (<AniView>AniUtils.ac).doWorldMapSlide(1);
                }
                else 
                    await this.openFinishGameView();
            }
            else
                this.refresh();
        }
    }

    async openMapEventSels(lv, n) {
        // 过滤掉已出现的事件
        var es = this.worldmap.cfg.events;
        var events = {};
        for(var event in es){
            // 当前地图只完成一次的移除掉
            if (Utils.contains(this.player.finishedEvent, event))
                continue;

            // 达到全局次数限制的移除掉
            var cfg = GCfg.getWorldMapEventSelGroupsCfg(event);
            if (cfg && cfg.globalCountMax != undefined) { // 手动判断 undefined 是为了兼容 globalCountMax == 0 的时候
                var globalCountMax = cfg.globalCountMax;
                var cnt = this.player.globalEventFinishedCount[event];
                if (!cnt) cnt = 0;
                if (cnt >= globalCountMax)
                    continue;
            }

            events[event] = es[event];
        }

        var evt = Utils.randomSelectByWeight(events, this.player.playerRandom, 1, 2)[0];
        var p = this.worldmap.player;

        switch (evt) {
            case "normal":
                var btRandonSeed = p.playerRandom.nextInt(0, 10000);
                await this.startNewBattle(p, "normal", lv, n, btRandonSeed);
                break;
            case "box":
                await this.openBoxRoom(this.worldmap.cfg.boxroomDrops);
                break;
            case "shop":
                await this.openShop(this.worldmap.cfg.shop);
                break;
            case "turntable":
                await this.openTurntable(this.worldmap.cfg.turntable);
                break;
            default: {
                // 此外就都认为是地图选项事件
                this.wmesFact.startBattle = async (battleType, extraLevelLogic) => {
                    var btRandonSeed = p.playerRandom.nextInt(0, 10000);
                    await this.startNewBattle(p, battleType, lv, n, btRandonSeed, false, extraLevelLogic);
                };

                this.wmesFact.selRelic = this.selRelic;

                await this.openSelGroup(p, evt);

                // 这一类事件是出现一次就不在出现
                this.player.finishedEvent.push(evt);

                // 全局次数限制
                var globalCnt = this.player.globalEventFinishedCount[evt];
                this.player.globalEventFinishedCount[evt] = globalCnt ? globalCnt + 1 : 1;
                    
            }
        }
    }

    async openSelGroup(p:Player, group) {
        var selsGroup = GCfg.getWorldMapEventSelGroupsCfg(group);
        var sels = this.wmesFact.createGroup(p, selsGroup.sels);
        await this.openEventSels(selsGroup.title, selsGroup.desc, selsGroup.bg, sels);
    }

    async openSels(p:Player, title, desc, bg, sels) {
        await this.openEventSels(title, desc, bg, sels);
    }
}
