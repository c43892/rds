
class AniUtils {
    public static aniFact:AnimationFactory = new AnimationFactory();

    // 物品添加到地图中，从原地跳出来的效果
    public static async JumpInMap(obj:egret.DisplayObject) {
        await AniUtils.aniFact.createAni("aniGroup", [
            AniUtils.aniFact.createAni("jumping", {obj:obj, fy:obj.y + 75, ty:obj.y, time:750}),
            AniUtils.aniFact.createAni("fade", {obj:obj, fa:0, ta:1, time:250}),
        ]);
    }

    // 怪物从地下冒出来的效果
    public static async CrawlOut(obj:egret.DisplayObject) {
        await this.aniFact.createAni("aniGroup", [
            this.aniFact.createAni("fade", {obj:obj, 
                fx:obj.x, fy:obj.y + 50,
                tx:obj.x, ty:obj.y,
                fa:0, ta:1, time:250, mode:egret.Ease.circOut}),
        ]);
    }

    // 从一个位置飞出来，到另外一个位置出现
    public static async FlyOut(obj:egret.DisplayObject, fromPos) {
        var aniFact = AniUtils.aniFact;
        var midX = (fromPos.x + obj.x) / 2;
        var topY = fromPos.y < obj.y ? fromPos.y : obj.y;
        var midY = topY - 100;
        var t = 200;
        await aniFact.createAni("aniGroup", [
            aniFact.createAni("aniSeq", [
                aniFact.createAni("aniGroup", [
                    aniFact.createAni("jumping", {obj:obj, fy:fromPos.y, ty:midY, time:t, mode:egret.Ease.sineOut}),
                    aniFact.createAni("fade", {obj:obj, fx:fromPos.x, tx:midX, time:t})
                ]),
                aniFact.createAni("aniGroup", [
                    aniFact.createAni("jumping", {obj:obj, fy:midY, ty:obj.y, time:t, mode:egret.Ease.sineIn}),
                    aniFact.createAni("fade", {obj:obj, fx:midX, tx:obj.x, time:t})
                ])
            ]),
            aniFact.createAni("fade", {obj:obj, fa:0, ta:1, time:100}),
        ]);
    }

    // 用逻辑坐标来计算 FlyOut 的位置
    public static async FlyOutLogicPos(obj:egret.DisplayObject, fromLogicPos, mv:MapView) {
        var g = mv.getGridViewAt(fromLogicPos.x, fromLogicPos.y);
        var ewp = obj.localToGlobal();
        var gwp = g.localToGlobal();
        await AniUtils.FlyOut(obj, {x:gwp.x - ewp.x, y:gwp.y - ewp.y});
    }
}
