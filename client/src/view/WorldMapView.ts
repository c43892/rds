// 大地图视图
class WorldMapView extends egret.DisplayObjectContainer {
    public player:Player;
    private viewContent:egret.DisplayObjectContainer;
    private bg:egret.Bitmap;
    private mapArea:egret.ScrollView;

    public openShop; // 打开商店
    public openHospital; // 进入医院
    public openBoxRoom; // 宝箱房间

    public constructor(w:number, h:number) {
        super();
        this.width = w;
        this.height = h;

        this.bg = ViewUtils.createBitmapByName("WorldMapBg_png");
        this.bg.x = 0;
        this.bg.y = 0;

        this.viewContent = new egret.DisplayObjectContainer();
        this.viewContent.x = 0;
        this.viewContent.y = 0;
        this.viewContent.width = this.bg.width;
        this.viewContent.height = this.bg.height;
        this.viewContent.addChild(this.bg);

        this.mapArea = new egret.ScrollView();
        this.mapArea.verticalScrollPolicy = "auto";
        this.mapArea.horizontalScrollPolicy = "off";
        this.mapArea.setContent(this.viewContent);
        this.mapArea.bounces = false;        
        this.addChild(this.mapArea);

        this.refresh();
        this.mapArea.scrollTop = this.viewContent.height - this.mapArea.height;

        this.touchEnabled = false;
        this.mapArea.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTouchGrid, this);
    }

    pts = [];
    public refresh() {
        this.mapArea.width = this.width - 20;
        this.mapArea.height = this.height - 110;
        this.mapArea.x = 10;
        this.mapArea.y = 10;

        this.viewContent.removeChildren();
        this.viewContent.addChild(this.bg);

        if (!this.worldmap)
            return;

        var wp = this.worldmap;

        // 显示每个节点
        var imgs = [];
        var xEdgeBlank = 50;
        var yGap = this.viewContent.height / wp.nodes.length;
        var xGap = (this.mapArea.width - 2 * xEdgeBlank) / (wp.worldCfg.width - 1);
        var xSwing = 0.25;
        var ySwing = 0.25;


        for (var i = 0; i < wp.nodes.length; i++) {
            var y = yGap * i;
            var row = [];
            for (var j = 0; j < wp.nodes[i].length; j++) {
                if(wp.nodes[i][j].parents.length != 0){
                    var pt = wp.nodes[i][j].roomType;
                    var img = ViewUtils.createBitmapByName(pt + "_png");
                    if(i == wp.nodes.length - 1){
                        img.x = (wp.nodes[i].length - 1) / 2 * xGap + xEdgeBlank;//boss点
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
                    row.push(img);
                }else 
                row.push("");
            }
            imgs.push(row);
        }

        for(var i = 0; i < wp.nodes.length; i++){
            for(var j = 0; j < wp.nodes[i].length; j++){
                if(wp.nodes[i][j].parents.length != 0){
                    for(var k = 0; k < wp.nodes[i][j].routes.length; k++){
                        var n = wp.nodes[i][j];
                        var l:egret.Shape = new egret.Shape();
                        l.graphics.lineStyle(3, 0x888888);
                        l.graphics.moveTo(imgs[i][j].x ,imgs[i][j].y);
                        if(i == wp.nodes.length - 2){
                            l.graphics.lineTo((wp.nodes[i].length - 1) / 2 * xGap + xEdgeBlank, 
                                               WorldMapNode.getNodeYposOnView(n.routes[k].dstNode, this.viewContent.height, yGap, 0));//至boss路线
                        } else{
                            l.graphics.lineTo(WorldMapNode.getNodeXposOnView(n.routes[k].dstNode, xEdgeBlank, xGap, xSwing), 
                                              WorldMapNode.getNodeYposOnView(n.routes[k].dstNode, this.viewContent.height, yGap, ySwing));
                        }
                        l.graphics.endFill();
                        // Utils.log("draw a line from",n.x, n.y,"to", n.routes[k].dstNode.x, n.routes[k].dstNode.y);
                        this.viewContent.addChild(l);
                    }
                this.viewContent.addChild(imgs[i][j]);
                }
            }
        }

        // 显示可选节点动画
        var sps = BattleUtils.getSelectableStoreyPos(this.worldmap.player);
        for (var sp of sps) {
            var img:egret.Bitmap = imgs[sp.lv][sp.n];
            var tw = egret.Tween.get(img, {loop:true});
            var w = img.width;
            var h = img.height;
            tw.to({width:w*1.5, height:h*1.5}, 1000, egret.Ease.quadInOut)
                .to({width:w, height:w}, 1000, egret.Ease.quadInOut);
        }

        // 显示可经过的节点
        for (var sp of this.worldmap.player.finishedStoreyPos)
            ViewUtils.makeGray(imgs[sp.lv][sp.n]);
    }

    worldmap:WorldMap;
    public setWorldMap(worldmap:WorldMap) {
        this.worldmap = worldmap;
        this.refresh();
    }

    public startNewBattle; // 开启一场新战斗
    async onTouchGrid(evt:egret.TouchEvent) {

        var bmp = evt.target;
        if (!(bmp instanceof egret.Bitmap))
            return;

        var ptType = bmp["ptType"];
        var ptStoreyLv = bmp["ptStoreyLv"];
        var ptStoreyN = bmp["ptStoreyN"];

        // if (!BattleUtils.isStoreyPosSelectable(this.worldmap.player, {lv:ptStoreyLv, n:ptStoreyN}))
        //     return;

        Utils.assert(this.worldmap.nodes[ptStoreyLv][ptStoreyN].roomType == ptType, 
            "worldmap storey type ruined: " + ptType + " vs " + this.worldmap.nodes[ptStoreyLv][ptStoreyN].roomType);

        this.enterNode(ptStoreyLv, ptStoreyN);
    }

    public async enterNode(lv:number, n:number) {
        var parent = this.parent;
        parent.removeChild(this);
        
        // 保存进度
        this.player.notifyStoreyPosIn(lv, n);
        Utils.$$saveItem("player", this.player.toString());
        
        var nodeType = this.worldmap.nodes[lv][n].roomType;
        Utils.log("type",nodeType);
        switch(nodeType) {
            case "normal":
            case "senior":
            case "boss":
                var p = this.worldmap.player;
                var btRandonSeed = p.playerRandom.nextInt(0, 10000);
                await this.startNewBattle(p, lv, n, btRandonSeed);
                break;
            case "shop":
                await this.openShop("worldmap");
                break;
            case "camp":
                await this.openHospital();
                break;
            case "box":
                await this.openBoxRoom(this.worldmap.worldCfg.boxroomDrops);
                break;
            default:
                Utils.log("not support " + nodeType + " yet");
            break;
        }

        // 保存进度
        this.player.notifyStoreyPosFinished(this.player.currentStoreyPos.lv, this.player.currentStoreyPos.n);
        Utils.$$saveItem("player", this.player.toString());

        parent.addChild(this);
        this.refresh();
    }
}
