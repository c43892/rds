// 大地图视图
class WorldMapView extends egret.DisplayObjectContainer {

    private bg:egret.Bitmap;
    private mapArea:egret.ScrollView;

    public constructor(w:number, h:number) {
        super();
        this.width = w;
        this.height = h;

        this.bg = ViewUtils.createBitmapByName("WorldMapBg_png");
        this.bg.x = 0;
        this.bg.y = 0;

        this.mapArea = new egret.ScrollView();
        this.mapArea.verticalScrollPolicy = "auto";
        this.mapArea.horizontalScrollPolicy = "off";
        this.mapArea.setContent(this.bg);
        this.mapArea.bounces = false;
        this.refresh();

        this.addChild(this.mapArea);
    }

    public refresh() {
        this.mapArea.width = this.width - 20;
        this.mapArea.height = this.height - 110;
        this.mapArea.x = 10;
        this.mapArea.y = 10;
    }
}
