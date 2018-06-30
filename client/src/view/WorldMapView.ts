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

        // 显示每一层
        var imgs = [];
        var storeyHeight = this.viewContent.height / (wp.stories.length + 1);
        for (var i = 0; i < wp.stories.length; i++) {
            var y = storeyHeight * (i + 1);
            imgs.push([]);
            for (var j = 0; j < wp.stories[i].length; j++) {
                var pt = wp.stories[i][j];
                var img = ViewUtils.createBitmapByName(pt + "_png");
                img.x = wp.xpos[i][j] * (this.mapArea.width - 50) + 25;
                img.y = this.viewContent.height - y;
                img.anchorOffsetX = img.width / 2;
                img.anchorOffsetY = img.height / 2;
                this.viewContent.addChild(img);
                imgs[i].push(img);
            }
        }

        // 显示连接关系
        var cnt = [];
        for (var i = 0; i < wp.stories.length - 1; i++) {
            var conns = wp.conns[i];
            cnt.push(0);
            for (var j = 0; j < conns.length; j++) {
                var conn2 = conns[j]
                for (var k = 0; k < conn2.length; k++) {
                    var l:egret.Shape = new egret.Shape();
                    l.graphics.lineStyle(2, 0x888888);
                    l.graphics.moveTo(imgs[i][j].x, imgs[i][j].y);
                    l.graphics.lineTo(imgs[i+1][conn2[k]-1].x, imgs[i+1][conn2[k]-1].y);
                    l.graphics.endFill();
                    this.viewContent.addChild(l);
                    cnt[i]++;
                }
            }
        }
    }

    worldmap:WorldMap;
    public setWorldMap(worldmap:WorldMap) {
        this.worldmap = worldmap;
        this.refresh();
    }
}
