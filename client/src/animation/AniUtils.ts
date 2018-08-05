
class AniUtils {
    public static ac:egret.DisplayObjectContainer;
    public static aniFact:AnimationFactory;

    public static reserveObjTrans(obj:egret.DisplayObject) {
        var parent = obj.parent;
        var x = obj.x;
        var y = obj.y;
        var wp = obj.localToGlobal();
        AniUtils.ac.addChild(obj);
        obj.x = wp.x;
        obj.y = wp.y;
        AniUtils.ac.parent.setChildIndex(AniUtils.ac, -1);
        return () => {
            parent.addChild(obj);
            obj.x = x;
            obj.y = y;
        };
    }

    // 物品添加到地图中，从原地跳出来的效果
    public static async JumpInMap(obj:egret.DisplayObject) {
        var rev = AniUtils.reserveObjTrans(obj);
        await AniUtils.aniFact.createAni("aniGroup", [
            AniUtils.aniFact.createAni("jumping", {obj:obj, fy:obj.y + 75, ty:obj.y, time:750}),
            // AniUtils.aniFact.createAni("fade", {obj:obj, fa:0, ta:1, time:250}),
        ]);
        rev();
    }

    // 怪物从地下冒出来的效果
    public static async CrawlOut(obj:egret.DisplayObject) {
        var rev = AniUtils.reserveObjTrans(obj);
        await this.aniFact.createAni("aniGroup", [
            this.aniFact.createAni("fade", {obj:obj, 
                fx:obj.x, fy:obj.y + 50,
                tx:obj.x, ty:obj.y,
                fa:0, ta:1, time:250, mode:egret.Ease.circOut}),
        ]);
        rev();
    }

    // 从一个位置飞出来，到另外一个位置出现
    public static async FlyOut(obj:egret.DisplayObject, fromPos) {
        var rev = AniUtils.reserveObjTrans(obj);        
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
        rev();
    }

    // 用逻辑坐标来计算 FlyOut 的位置
    public static async FlyOutLogicPos(obj:egret.DisplayObject, fromLogicPos, mv:MapView) {
        var g = mv.getGridViewAt(fromLogicPos.x, fromLogicPos.y);
        var gwp = g.localToGlobal();
        await AniUtils.FlyOut(obj, gwp);
    }

    // 加速直线从一个位置飞向目标位置，并在目标位置固定住。比如获得遗物或者物品的效果
    public static async Fly2(obj:egret.DisplayObject, from, to) {
        var rev = AniUtils.reserveObjTrans(obj);
        var t = 500;
        var aniFact = AniUtils.aniFact;
        var fp = from instanceof egret.DisplayObject ? from.localToGlobal() : from;
        var tp = to instanceof egret.DisplayObject ? to.localToGlobal() : to;
        var mw = from.width * 1.3;
        var mh = from.height * 1.3;
        var mx = fp.x - (mw - from.width) / 2;
        var my = fp.y - (mh - from.height) / 2;
        await aniFact.createAni("aniSeq", [
                aniFact.createAni("fade", {obj:obj, 
                    fx:fp.x, fy:fp.y, tx:mx, ty:my, time:250,
                    tw:mw, th:mh, mode:egret.Ease.circOut
                }),
                aniFact.createAni("fade", {obj:obj,
                    fx:mx, fy:my, fw:mw, fh:mh,
                    tx:tp.x, ty:tp.y, tw:to.width, th:to.height, time:t, mode:egret.Ease.quadInOut}),
                aniFact.createAni("fade", {obj:obj, fa:0, ta:1, time:t, mode:egret.Ease.elasticOut}),
            ]
        );
        rev();
    }
}
