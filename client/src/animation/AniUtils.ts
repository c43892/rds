
class AniUtils {
    public static ac:egret.DisplayObjectContainer;
    public static aniFact:AnimationFactory;

    public static reserveObjTrans(obj:egret.DisplayObject, ...poses) {
        var parent = obj.parent;
        var x = obj.x;
        var y = obj.y;
        var wp = obj.localToGlobal();
        var ax = obj.anchorOffsetX;
        var ay = obj.anchorOffsetY;
        obj.anchorOffsetX = obj.width / 2;
        obj.anchorOffsetY = obj.height / 2;
        AniUtils.ac.addChild(obj);
        obj.x = wp.x + obj.anchorOffsetX;
        obj.y = wp.y + obj.anchorOffsetY;
        AniUtils.ac.parent.setChildIndex(AniUtils.ac, -1);

        for (var pos of poses) {
            pos.x += obj.anchorOffsetX;
            pos.y += obj.anchorOffsetY;
        }

        return () => {
            parent.addChild(obj);
            obj.anchorOffsetX = ay;
            obj.anchorOffsetY = ax;
            obj.x = x;
            obj.y = y;
        };
    }

    // 物品添加到地图中，从原地跳出来的效果
    public static async JumpInMap(obj:egret.DisplayObject) {
        var rev = AniUtils.reserveObjTrans(obj);
        await AniUtils.aniFact.createAni("aniGroup", [
            AniUtils.aniFact.createAni("jumping", {obj:obj, fy:obj.y + 75, ty:obj.y, time:750}),
            AniUtils.aniFact.createAni("fade", {obj:obj, fa:0, ta:1, time:250}),
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
        var rev = AniUtils.reserveObjTrans(obj, fromPos);        
        var aniFact = AniUtils.aniFact;
        var midX = (fromPos.x + obj.x) / 2;
        var topY = fromPos.y < obj.y ? fromPos.y : obj.y;
        var midY = topY - 100;
        var t = 250;
        var fr = 0;
        var tr = obj.x < fromPos.x ? -360 : 360;
        await aniFact.createAni("aniGroup", [
            aniFact.createAni("aniSeq", [
                aniFact.createAni("aniGroup", [
                    aniFact.createAni("jumping", {obj:obj, fy:fromPos.y, ty:midY, time:t, mode:egret.Ease.sineOut}),
                    aniFact.createAni("fade", {obj:obj, fx:fromPos.x, tx:midX, time:t})
                ]),
                aniFact.createAni("aniGroup", [
                    aniFact.createAni("jumping", {obj:obj, fy:midY, ty:obj.y, time:t, mode:egret.Ease.sineIn}),
                    aniFact.createAni("fade", {obj:obj, fx:midX, tx:obj.x, time:t})
                ]),
            ]),
            aniFact.createAni("fade", {obj:obj, fr:fr, tr:tr, time:t * 2}),
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
    public static async Fly2(obj:egret.DisplayObject, from, to, noRotationAndPara = false) {
        var fp = from instanceof egret.DisplayObject ? from.localToGlobal() : from;
        var tp = to instanceof egret.DisplayObject ? to.localToGlobal() : to;

        var rev = AniUtils.reserveObjTrans(obj, fp, tp);
        var aniFact = AniUtils.aniFact;

        var isUp = tp.y < fp.y; // 是否是向上飞行

        // 确定旋转方向
        var tr = tp.x < fp.x ? -360 : 360;

        // 中间阶段的大小变化
        var mw = from.width * (isUp ? 0.8: 1.2);
        var mh = from.height * (isUp ? 0.8: 1.2);

        // 中间阶段的位置和转动角度
        var mx = (tp.x - fp.x)/5 + fp.x;
        var my = fp.y + (isUp ? 0 : -100);
        var mr = tr / 3;

        await aniFact.createAniByCfg({
            type:"aniSeq", arr: [ // 一个动画序列
                {type:"aniSeq", arr: [ // 移动过程，也是一个序列
                    {type:"aniGroup", arr: [
                        {type:"fade", fy:fp.y, ty:my, time:250, tw:mw, th:mh, mode:egret.Ease.quartOut}, // 微微放大抬起来
                        {type:"fade", fr:0, tx:mx, tr:mr, time:250}, // 伴随旋转
                    ]},
                    {type:"aniGroup", arr: [
                        {type:"fade", fy:my, ty:tp.y, time:250, fw:mw, fh:mh, tw:to.width, th:to.height, mode:egret.Ease.quadIn}, // 飞向目标
                        {type:"fade", fr:mr, tr:tr, fx:mx, tx:tp.x, time:250}, // 伴随旋转
                    ]},
                ]}, 
                {type:"fade", fa:1, ta:3, time:200, mode:egret.Ease.quadOut}, // 颜色反白
                {type:"fade", fa:3, ta:1, time:200, mode:egret.Ease.quadOut}, // 颜色恢复
            ]
        }, obj);

        rev();
    }
}
