// 大地图视图
class WorldMapView extends egret.DisplayObjectContainer {
    private viewContent:egret.DisplayObjectContainer;
    private bg:egret.Bitmap;
    private mapArea:egret.ScrollView;

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

        this.touchEnabled = false;
        this.addEventListener(egret.TouchEvent.TOUCH_TAP, this.onTouchGrid, this);
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
        var storeyHeight = this.viewContent.height / wp.stories.length;
        for (var i = 0; i < wp.stories.length; i++) {
            var y = storeyHeight * i;
            imgs.push([]);
            for (var j = 0; j < wp.stories[i].length; j++) {
                var pt = wp.stories[i][j];
                var img = ViewUtils.createBitmapByName(pt + "_png");
                img.x = wp.xpos[i][j] * (this.mapArea.width - 50) + 25;
                img.y = this.viewContent.height - y;
                img.anchorOffsetX = img.width / 2;
                img.anchorOffsetY = img.height / 2;
                img["ptType"] = wp.stories[i][j];
                img["ptStoreyLv"] = i;
                img["ptStoreyN"] = j;
                img.touchEnabled = true;
                // this.viewContent.addChild(img);
                imgs[i].push(img);
            }
        }

        // 显示连接关系
        var cnt = [];
        for (var i = 1; i < wp.stories.length - 1; i++) {
            var conns = wp.conns[i];
            cnt.push(0);
            for (var j = 0; j < conns.length; j++) {
                var conn2 = conns[j]
                for (var k = 0; k < conn2.length; k++) {
                    var l:egret.Shape = new egret.Shape();
                    l.graphics.lineStyle(3, 0x888888);
                    l.graphics.moveTo(imgs[i][j].x, imgs[i][j].y);
                    l.graphics.lineTo(imgs[i+1][conn2[k]].x, imgs[i+1][conn2[k]].y);
                    l.graphics.endFill();
                    this.viewContent.addChild(l);
                    cnt[i]++;
                }
                this.viewContent.addChild(imgs[i][j]);
            }
        }
        this.viewContent.addChild(imgs[imgs.length - 1][0]);

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

        // if (!BattleUtils.isStoreyPosSelectable(this.worldmap.player, {lv:ptStoreyLv, n:ptStoreyN}))
        //     return;

        Utils.assert(this.worldmap.stories[ptStoreyLv][ptStoreyN] == ptType, 
            "worldmap storey type ruined: " + ptType + " vs " + this.worldmap.stories[ptStoreyLv][ptStoreyN]);

        switch(ptType) {
            case "normal":
            case "senior":
            case "boss":
                this.startNewBattle(this.worldmap.player, ptStoreyLv, ptStoreyN);
            break;
            default:
                Utils.log("not support " + ptType + " yet");
            break;
        }
    }
}
