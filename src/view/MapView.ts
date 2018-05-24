// 显示地图
class MapView extends egret.DisplayObjectContainer {
    private map:Map; // 对应地图数据

    // 设置新的地图数据，但并不自动刷新显示，需要手动刷新
    public setMap(map:Map) {
        this.map = map;
    }

    // 刷新地图显示，并不用于普通的地图数据变化，而是全部清除重建的时候用
    public Refresh() {
        this.Clear();

        // 背景图
        let bg = ViewUtils.createBitmapByName("bg_jpg");
        bg.width = this.width;
        bg.height = this.height;
        this.addChild(bg);
    }

    // 清除所有地图显示元素
    public Clear() {

    }
}