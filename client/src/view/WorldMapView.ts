// 大地图视图
class WorldMapView extends egret.DisplayObjectContainer {
    public player:Player;
    private viewContent:egret.DisplayObjectContainer;
    private bg0:egret.Bitmap;
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
    public selRelic2Inherit; // 选择用于继承的遗物
    public openFinishGameView; // 通关

    private wmesFact:WorldMapEventSelFactory;

    public constructor(w, h) {
        super();
        this.width = w;
        this.height = h;
        this.name = "worldmap";

        this.bg0 = ViewUtils.createBitmapByName("WorldMapBg_png", egret.BitmapFillMode.REPEAT);
        this.bg1 = ViewUtils.createBitmapByName("WorldMapBgBorder_png", egret.BitmapFillMode.REPEAT);
        this.bg2 = ViewUtils.createBitmapByName("WorldMapBgBorder_png", egret.BitmapFillMode.REPEAT);
        this.bgc = new egret.DisplayObjectContainer();
        this.bgc.addChild(this.bg0);
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
        this.wmesFact.selRelic = async () => await this.selRelic();
        this.wmesFact.openEventSelGroup = async (p:Player, group) => await this.openSelGroupByName(p, group);
        this.wmesFact.openSels = async (p:Player, title, desc, bg, sels) => await this.openSels(p, title, desc, bg, sels);
        this.wmesFact.openTurntable = async (turntable) => await this.openTurntable(turntable);
        this.wmesFact.selRelic2Inherit = async (relics4sel) => {
            return await this.selRelic2Inherit(relics4sel);
        };

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

        this.bg0.anchorOffsetX = this.bg0.width / 2;
        this.bg0.x = this.viewContent.width / 2;
        this.bg0.y = 0;
        this.bg0.height = this.viewContent.height;

        this.bg1.x = 0;
        this.bg1.y = 0;
        this.bg1.height = this.viewContent.height;

        this.bg2.x = this.bgc.width;
        this.bg2.y = 0;
        this.bg2.height = this.viewContent.height;
        this.bg2.scaleX = -1;

        // 外框

        // var xSpace = 10;
        // var ySpace = 20;

        // var head = ViewUtils.createBitmapByName("WorldMapBg2_png");
        // head.x = this.viewContent.width / 2 - head.width;
        // head.y = -15 + topLine;
        // this.viewContent.addChild(head);

        // var head2 = ViewUtils.createBitmapByName("WorldMapBg2_png");
        // head2.x = this.viewContent.width / 2 + head.width;
        // head2.y = head.y;
        // head2.scaleX = -1;        
        // this.viewContent.addChild(head2);

        // var head3 = ViewUtils.createBitmapByName("WorldMapBg2_png");
        // head3.x = head.x;
        // head3.y = this.viewContent.height - (ySpace - 15);
        // head3.scaleY = -1;
        // this.viewContent.addChild(head3);

        // var head4 = ViewUtils.createBitmapByName("WorldMapBg2_png");
        // head4.x = head2.x;
        // head4.y = head3.y;
        // head4.scaleX = -1;
        // head4.scaleY = -1;
        // this.viewContent.addChild(head4);

        // var clt = ViewUtils.createBitmapByName("WorldMapBgCorner_png");
        // clt.x = this.viewContent.width - this.width + xSpace;
        // clt.y = topLine;
        // clt.scale9Grid = new egret.Rectangle(clt.width - 2, clt.height - 2, 1, 1);
        // clt.width = this.width / 2 - head.width - clt.x;
        // clt.height = this.viewContent.height / 2 - clt.y;
        // this.viewContent.addChild(clt);

        // var crt = ViewUtils.createBitmapByName("WorldMapBgCorner_png");
        // crt.width = clt.width;
        // crt.height = clt.height;        
        // crt.scale9Grid = clt.scale9Grid;
        // crt.x = this.viewContent.width / 2 + crt.width + head.width;
        // crt.y = topLine;
        // crt.scaleX = -1;
        // this.viewContent.addChild(crt);

        // var clb = ViewUtils.createBitmapByName("WorldMapBgCorner_png");
        // clb.x = clt.x;
        // clb.y = this.viewContent.height - ySpace;
        // clb.scale9Grid = clt.scale9Grid;
        // clb.width = clt.width;
        // clb.height = clt.height;
        // clb.scaleY = -1;
        // this.viewContent.addChild(clb);

        // var crb = ViewUtils.createBitmapByName("WorldMapBgCorner_png");
        // crb.width = clt.width;
        // crb.height = clt.height;
        // crb.scale9Grid = clt.scale9Grid;
        // crb.x = crt.x;
        // crb.y = clb.y;
        // crb.scaleX = -1;
        // crb.scaleY = -1;
        // this.viewContent.addChild(crb);

        // var cn1 = ViewUtils.createBitmapByName("WorldMapBg1_png");
        // cn1.x = clt.x + 20;
        // cn1.y = clt.y + 12;
        // this.viewContent.addChild(cn1);

        // var cn2= ViewUtils.createBitmapByName("WorldMapBg1_png");
        // cn2.x = crt.x - 20;
        // cn2.y = cn1.y;
        // cn2.scaleX = -1;
        // this.viewContent.addChild(cn2);

        // var cn3 = ViewUtils.createBitmapByName("WorldMapBg1_png");
        // cn3.x = cn1.x;
        // cn3.y = clb.y - 12;
        // cn3.scaleY = -1;
        // this.viewContent.addChild(cn3);

        // var cn4 = ViewUtils.createBitmapByName("WorldMapBg1_png");
        // cn4.x = cn2.x;
        // cn4.y = cn3.y;
        // cn4.scaleX = -1;
        // cn4.scaleY = -1;
        // this.viewContent.addChild(cn4);
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
        var dotScale = 0.75; // 节点缩放
        var bossDotScale = dotScale * 2; // boss 节点缩放

        // 遍历所有节点,将具有父节点的作为可用节点,并记录该节点的属性.
        for (var i = 0; i < wp.nodes.length; i++) {
            var y = yGap * i;
            var row = [];
            var adoptRow = [];
            for (var j = 0; j < wp.nodes[i].length; j++) {
                if(wp.nodes[i][j].parents.length != 0){
                    var pt = wp.nodes[i][j].roomType;
                    var img = pt == "boss"
                        ? ViewUtils.createBitmapByName(wp.bossType + "BossNode" + "_png")
                        : ViewUtils.createBitmapByName("Node" + pt + "_png");
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
                    img.scaleX = img.scaleY = pt == "boss" ? bossDotScale : dotScale;
                    img.alpha = 0.75;
                    ViewUtils.makeGray(img, true);
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
                        var steps = dist / 40; // 根据距离确定步数
                        var stepsDx = (pt2x - pt1x) / steps;
                        var stepsDy = (pt2y - pt1y) / steps;
                        var stepRotation = Utils.getRotationFromTo(pt1, pt2); // 确定脚步方向

                        // 根据方向计算左右距离中心线的位置偏移
                        // var dPosX1 = Math.cos((stepRotation - 90) * Math.PI / 180) * 5;
                        // var dPosY1 = Math.sin((stepRotation - 90) * Math.PI / 180) * 5;
                        // var dPosX2 = Math.cos((stepRotation + 90) * Math.PI / 180) * 5;
                        // var dPosY2 = Math.sin((stepRotation + 90) * Math.PI / 180) * 5;

                        // 首尾让出来几步，避免盖住节点图标
                        var stepImgArr:egret.Bitmap[] = [];
                        for (var st = 1; st < steps - 1; st++) {
                            var stepImg = ViewUtils.createBitmapByName("FootPrint_png");
                            stepImg.x = pt1x + stepsDx * st; // + (st%2==0?dPosX1:dPosX2);
                            stepImg.y = pt1y + stepsDy * st; // + (st%2==0?dPosY1:dPosY2);
                            stepImg.anchorOffsetX = stepImg.width / 2;
                            stepImg.anchorOffsetY = stepImg.height / 2;
                            stepImg.rotation = stepRotation; // + (st%2==0?-15:15);
                            // stepImg.scaleX = st%2==0?1:-1; // 左右脚印需要对称反转
                            // stepImg.scaleX = 0.75;
                            // stepImg.scaleY = 0.75;
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

        // 显示可选区域
        var sps = BattleUtils.getSelectableStoreyPos(this.worldmap.player);
        var imgArr:egret.Bitmap[] = Utils.map(sps, (sp) => {
            return imgs[sp.lv][sp.n];
        });

        // 计算可选节点的中心位置和横向范围距离
        var xMin = Number.MAX_VALUE;
        var xMax = -Number.MAX_VALUE;
        var xSum = 0;
        var ySum = 0;
        for (var img of imgArr) {
            xSum += img.x;
            ySum += img.y;
            if (xMin > img.x) xMin = img.x;
            if (xMax < img.x) xMax = img.x;
        }

        var cx = xSum / imgArr.length;
        var cy = ySum / imgArr.length;
        var dx = xMax == xMin ? this.viewContent.width / 8 : xMax - xMin;

        // 用一个容器先构造好迷雾效果
        var mistContainer = new egret.DisplayObjectContainer();

        // 黑色压暗背景
        var mistBg = ViewUtils.createBitmapByName("mistBg_png");
        mistBg.x = mistBg.y = 0;
        mistBg.width = this.viewContent.width;
        mistBg.height = this.viewContent.height;
        mistBg.alpha = 0.7;
        mistContainer.addChild(mistBg);

        // 两层亮斑区域，一层擦除黑色背景，一层是实际显示效果

        var mistSpot1 = ViewUtils.createBitmapByName("mistSpot_png");
        mistSpot1.blendMode = egret.BlendMode.ERASE;
        mistSpot1.width = dx * 4;
        mistSpot1.height = dx * 2;
        mistSpot1.x = cx - mistSpot1.width / 2;
        mistSpot1.y = cy - mistSpot1.height / 2;
        mistSpot1.alpha = 10;
        mistContainer.addChild(mistSpot1);

        var mistSpot2 = ViewUtils.createBitmapByName("mistSpot_png");
        mistSpot2.width = dx * 4;
        mistSpot2.height = dx * 2;
        mistSpot2.x = cx - mistSpot2.width / 2;
        mistSpot2.y = cy - mistSpot2.height / 2;
        mistContainer.addChild(mistSpot2);

        // 将迷雾效果渲染到纹理，再加入图层

        var mistRT = new egret.RenderTexture();
        var mistBmp = new egret.Bitmap();
        mistRT.drawToTexture(mistContainer);
        ViewUtils.setTex(mistBmp, mistRT);
        mistBmp.x = mistBmp.y = 0;
        this.viewContent.addChild(mistBmp);

        // 显示可经过的节点
        var lastSp;
        for (var sp of this.worldmap.player.finishedStoreyPos) {
            var adpImg:egret.Bitmap = adoptImgs[sp.lv][sp.n];
            if (!adpImg) continue;
            adpImg.alpha = 1;
            ViewUtils.makeGray(imgs[sp.lv][sp.n], false);
            
            // 处理脚步路径
            if (lastSp) {
                var from = lastSp;
                var to = sp;
                
                for (var k = 0; k < wp.nodes[from.lv][from.n].routes.length; k++) {
                    var kr = wp.nodes[from.lv][from.n].routes[k];
                    if (to.lv == kr.dstNode.y && to.n == kr.dstNode.x) {
                        allSteps[from.lv][from.n][k].forEach((img, _) => {
                            img.alpha = 1;
                            this.viewContent.setChildIndex(img, -1);
                        });
                        break;
                    }
                }
            }

            lastSp = sp;
            adpImg.scaleX = adpImg.scaleY = dotScale;
            this.viewContent.addChild(adpImg);

            this.viewContent.setChildIndex(imgs[sp.lv][sp.n], -1);
            this.viewContent.setChildIndex(adpImg, -1);
        }

        // 显示可选节点动画
        var sps = BattleUtils.getSelectableStoreyPos(this.worldmap.player);
        var sr = new SRandom();
        for (var sp of sps) {
            var img:egret.Bitmap = imgs[sp.lv][sp.n];
            if (!img) continue;
            img.alpha = 1;
            var t = sr.nextInt(1000, 2000);
            var s = img["ptType"] == "boss" ? bossDotScale : dotScale;
            egret.Tween.get(img, {loop:true}).to({scaleX:1.1*s, scaleY:1.1*s}, t, egret.Ease.quadInOut)
                .to({scaleX:s, scaleY:s}, t, egret.Ease.quadInOut);
            egret.Tween.get(img, {loop:true}).to({alpha:2.5}, t, egret.Ease.quadInOut)
                .to({alpha:1}, t, egret.Ease.quadInOut);

            // var outline = ViewUtils.createBitmapByName("BoxRoomFlash_png");
            // img.parent.addChild(outline);
            // img.parent.setChildIndex(img, -1);
            // outline.anchorOffsetX = outline.width / 2;
            // outline.anchorOffsetY = outline.height / 2;
            // outline.x = img.x;
            // outline.y = img.y;
            // img.alpha = 0.5;
            // egret.Tween.get(outline, {loop:true}).to({alpha:0}, 1000, egret.Ease.quadInOut)
            //     .to({alpha:1}, 1000, egret.Ease.quadInOut);
            // egret.Tween.get(img, {loop:true}).to({alpha:1}, 1000, egret.Ease.quadInOut)
            //     .to({alpha:0.5}, 1000, egret.Ease.quadInOut);
        }

        // 所有未来可达的点
        var currentNode = WorldMapNode.getNode(this.player.currentStoreyPos.n, this.player.currentStoreyPos.lv, this.player.worldmap.nodes);
        var connectableNodes = currentNode.getConnectableNodes();
        for (var nd of connectableNodes) {
            var lv = nd.y;
            var ndN = nd.x;

            // 对应的路径脚步
            for (var k = 0; k < nd.routes.length; k++) {
                var kr = nd.routes[k];
                allSteps[lv][ndN][k].forEach((stepImg, _) => {
                    stepImg.alpha = 1;
                    this.viewContent.setChildIndex(stepImg, -1);
                });
            }

            var img:egret.Bitmap = imgs[lv][ndN];
            ViewUtils.makeGray(img, false);
            img.alpha = 1;
            this.viewContent.setChildIndex(img, -1);
        }

        // // 处理脚步路径
        // if (lastSp) {
        //     for (var k = 0; k < wp.nodes[lastSp.lv][lastSp.n].routes.length; k++) {
        //         var kr = wp.nodes[lastSp.lv][lastSp.n].routes[k];
        //         allSteps[lastSp.lv][lastSp.n][k].forEach((img, _) => img.alpha = 1);
        //     }
        // }
    }

    // 设置滚动位置(0:顶部 - 1:底部)
    public set mapScrollPos(p:number) {
        var pTop = this.mapArea.height / 2 / this.viewContent.height;
        var pBottom = 1 - pTop;
        if (p <= pTop)
            p = 0;
        else if (p >= pBottom)
            p = 1;
        else
            p = (p - pTop) / pBottom;
        
        this.rawMapScrollPosRange = p;
    }

    // 不加修正的滚动值，一般动画用
    public set rawMapScrollPosRange(p:number) {
        var top = (this.viewContent.height - this.mapArea.height) * p;
        this.mapArea.scrollTop = top;
    }

    // 不加修正的滚动值，一般动画用
    public get rawMapScrollPosRange() {
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
        var trueLv = p.currentTotalStorey();

        // 记住当前信息，可能开局要给奖励
        Utils.saveLocalData("lastLevelCompletedInfo", {
            "lv": trueLv,
            "relics": Utils.map(this.player.allRelics, (r:Relic) => r.type),
            "props": Utils.map(this.player.props, (p:Prop) => p.type)
        });
        
        switch(nodeType) {
            case "normal":
                var btRandonSeed = p.playerRandom.nextInt(0, 10000);
                this.refreshShopSoldout() // 刷新战斗内商店销售状态
                await this.startNewBattle(p, nodeType, trueLv, n, btRandonSeed, skipBlackIn);
                break;
            case "senior":
                var btRandonSeed = p.playerRandom.nextInt(0, 10000);
                this.refreshShopSoldout() // 刷新战斗内商店销售状态
                var seniorTypes = GCfg.getBattleTypes("senior");
                var seniorType = seniorTypes[this.player.playerRandom.nextInt(0, seniorTypes.length)];
                await this.startNewBattle(p, seniorType, trueLv, n, btRandonSeed, skipBlackIn);
                break;
            case "boss":
                var btRandonSeed = p.playerRandom.nextInt(0, 10000);
                this.refreshShopSoldout() // 刷新战斗内商店销售状态
                var bossType = this.worldmap.bossType;
                await this.startNewBattle(p, bossType, trueLv, n, btRandonSeed, skipBlackIn);
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
                await this.openMapEventSels(trueLv, n);
                break;
            default:
                Utils.log("not support " + nodeType + " yet");
            break;
        }

        // 检查死亡
        if (this.player.isDead()) {
            var diePs = {reborn:false};
            await this.player.fireEvent("onPlayerDying", diePs);
            await this.player.triggerLogicPoint("onPlayerDying", diePs);

            if (diePs.reborn) {
                this.player.reborn();
                await this.player.fireEvent("onPlayerReborn", {inBattle:false});
                await this.player.triggerLogicPoint("onPlayerReborn", {inBattle:false});
            } else {
                await this.player.fireEvent("onPlayerDead");
            }
        }

        // 记住当前信息，可能开局要给奖励
        Utils.saveLocalData("lastLevelCompletedInfo", {
            "lv": trueLv,
            "relics": Utils.map(this.player.allRelics, (r:Relic) => r.type),
            "props": Utils.map(this.player.props, (p:Prop) => p.type)
        });
        
        // 可能又被复活了
        if (!this.player.isDead()) {
            // 保存进度
            this.player.notifyStoreyPosFinished(this.player.currentStoreyPos.lv, this.player.currentStoreyPos.n);

            // 如果是新手玩家,要标记为已完成新手指引关
            if(Utils.checkRookiePlay() && trueLv >= 5) {
                Utils.saveLocalData("rookiePlay", "finished");
                Utils.pt("rookiePlayFinished", true);
            }

            Utils.savePlayer(this.player, "onBattleEnd");

            // 更新最高分
            var score = BattleStatistics.getFinalScore(BattleStatistics.getScoreInfos(this.player.st));
            Utils.saveCloudData("score", score + "," + this.player.occupation);
            Utils.pt("score", score);
            
            // 判断此世界是否已经完成
            if(this.player.currentStoreyPos.lv >= this.player.worldmap.cfg.totalLevels){
                // 已完成的话,判断该难度下时候有下一个世界
                this.player.finishedWorldMap.push(this.worldmap.cfg);
                this.player.currentStoreyPos.lv = 0;
                var thisWorldName = this.worldmap.cfg.name;
                var worlds = GCfg.getDifficultyCfg()[this.player.difficulty].worlds;
                var nextWorldName = worlds[Utils.indexOf(worlds, (name) => name == thisWorldName) + 1];

                if(nextWorldName)
                    await this.onPlayerGo2NewWorld(nextWorldName);
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
        if(Utils.checkRookiePlay())
            evt = "a3"; // 新手事件固定
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

                // this.wmesFact.selRelic = this.selRelic;
                await this.openSelGroupByName(p, evt);

                // 这一类事件是出现一次就不在出现
                this.player.finishedEvent.push(evt);

                // 全局次数限制
                var globalCnt = this.player.globalEventFinishedCount[evt];
                this.player.globalEventFinishedCount[evt] = globalCnt ? globalCnt + 1 : 1;
            }
        }
    }

    async openSelGroupByName(p:Player, groupName) {
        var selsGroup = GCfg.getWorldMapEventSelGroupsCfg(groupName);
        await this.openSelGroup(p, selsGroup);
    }

    async openSelGroup(p:Player, group) {
        var sels = this.wmesFact.createGroup(p, group.sels, group.extraRobSel);
        await this.openEventSels(group.title, group.desc, group.bg, sels);
    }

    async openSels(p:Player, title, desc, bg, sels) {
        await this.openEventSels(title, desc, bg, sels);
    }

    // 进入新的世界地图
    async onPlayerGo2NewWorld(newtWorldName){
        // 先进入整备界面
        await this.openShop(this.worldmap.cfg.shop, true);
        var newWorld = WorldMap.buildFromConfig(newtWorldName, this.player);
        this.player.goToNewWorld(newWorld);
        this.setWorldMap(this.player.worldmap);
        await (<AniView>AniUtils.ac).doWorldMapSlide(1, 2000, this.worldmap.cfg.worldNum);
    }
}
