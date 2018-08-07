
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
        obj.anchorOffsetX = obj.width * obj.scaleX / 2;
        obj.anchorOffsetY = obj.height * obj.scaleY / 2;
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
    public static async jumpInMap(obj:egret.DisplayObject) {
        var rev = AniUtils.reserveObjTrans(obj);

        await AniUtils.aniFact.createAniByCfg({type:"gp", arr:[
            {type:"tr", fy:obj.y + 75, ty:obj.y, time:750, mode:egret.Ease.elasticOut},
            {type:"tr", fa:0, ta:1, time:250},
        ]}, obj);
        
        rev();
    }

    // 怪物从地下冒出来的效果
    public static async crawlOut(obj:egret.DisplayObject) {
        var rev = AniUtils.reserveObjTrans(obj);
        
        await this.aniFact.createAniByCfg({type:"tr", 
            fx:obj.x, fy:obj.y + 50,
            tx:obj.x, ty:obj.y,
            fa:0, ta:1, time:250, mode:egret.Ease.circOut}, obj);

        rev();
    }

    // 从一个位置飞出来，到另外一个位置出现
    public static async flyOut(obj:egret.DisplayObject, fromPos, toPos = undefined) {
        var rev = AniUtils.reserveObjTrans(obj, fromPos);        
        var aniFact = AniUtils.aniFact;
        if (toPos) {
            obj.x = toPos.x;
            obj.y = toPos.y;
        }

        // 有一个弹起来的中间过程
        var midX = (fromPos.x + obj.x) / 2;
        var topY = fromPos.y < obj.y ? fromPos.y : obj.y;
        var midY = topY - 100;

        // 旋转方向
        var tr = obj.x < fromPos.x ? -360 : 360;

        await aniFact.createAniByCfg({type:"gp", arr:[
            {type:"seq", arr: [
                {type:"gp", arr: [
                    {type:"tr", fy:fromPos.y, ty:midY, time:250, mode:egret.Ease.sineOut},
                    {type:"tr", fx:fromPos.x, tx:midX, time:250},
                ]},
                {type:"gp", arr: [
                    {type:"tr", fy:midY, ty:obj.y, time:250, mode:egret.Ease.sineIn},
                    {type:"tr", fx:midX, tx:obj.x, time:250},
                ]},
            ]}, 
            {type:"tr", fr:0, tr:tr, time:500},
            {type:"tr", fa:0, ta:1, time:100},
        ]}, obj);

        rev();
    }

    // 用逻辑坐标来计算 FlyOut 的位置
    public static async flyOutLogicPos(obj:egret.DisplayObject, mv:MapView, fromLogicPos, toLogicPos = undefined) {
        await AniUtils.flyOut(obj, 
            mv.getGridViewAt(fromLogicPos.x, fromLogicPos.y).localToGlobal(), 
            toLogicPos ? mv.getGridViewAt(toLogicPos.x, toLogicPos.y).localToGlobal() : undefined);
    }

    // 加速直线从一个位置飞向目标位置，并在目标位置固定住。比如获得遗物或者物品的效果
    public static async fly2(obj:egret.DisplayObject, from, to, noRotation = false) {
        // 飞行开始和目标位置
        var fp = from.localToGlobal();
        var tp = to.localToGlobal();
        tp.x = tp.x - to.anchorOffsetX + to.width * to.scaleX / 2;
        tp.y = tp.y - to.anchorOffsetY + to.height * to.scaleY / 2;

        var rev = AniUtils.reserveObjTrans(obj, fp);
        var aniFact = AniUtils.aniFact;

        var toUp = tp.y < fp.y; // 是否是向上，目前向上是钱和遗物，向下是道具
        var toLeft = tp.x < fp.x; // 是否是向左

        // 确定旋转方向
        var tr = noRotation ? 0 : (toLeft ? -360 : 360);

        // 中间阶段的大小变化
        var msx = toUp ? 0.8: 1.2;
        var msy = toUp ? 0.8: 1.2;

        // 中间阶段的位置和转动角度
        var mx = (tp.x - fp.x)/5 + fp.x;
        var my = fp.y + (toUp ? 0 : -100);
        var mr = tr / 3;

        // 最终大小
        var sx = to.width / from.width;
        var sy = to.height / from.height;

        await aniFact.createAniByCfg({type:"seq", arr: [ // 一个动画序列
            {type:"seq", arr: [ // 移动过程，也是一个序列
                {type:"gp", arr: [
                    {type:"tr", fy:fp.y, ty:my, time:250, tsx:msx, tsy:msy, mode:egret.Ease.quartOut}, // 微微放大抬起来
                    {type:"tr", fr:0, tx:mx, tr:mr, time:250}, // 伴随旋转
                ]},
                {type:"gp", arr: [
                    {type:"tr", fy:my, ty:tp.y, time:250, fsx:msx, fsy:msy, tsx:sx, tsy:sy, mode:egret.Ease.quadIn}, // 飞向目标
                    {type:"tr", fr:mr, tr:tr, fx:mx, tx:tp.x, time:250}, // 伴随旋转
                ]},
            ]}, 
            {type:"tr", fa:1, ta:3, time:300, mode:egret.Ease.quadOut}, // 颜色反白
            {type:"tr", fa:3, ta:1, time:100, mode:egret.Ease.quadOut}, // 颜色恢复
        ]}, obj);

        rev();
    }

    // 怪物的一次攻击动作
    public static async monsterAttack(obj:egret.DisplayObject, targetPos = undefined) {
        var fp = obj.localToGlobal();
        var tp = targetPos ? targetPos : {x:0, y:0};
        var rev = AniUtils.reserveObjTrans(obj, fp, tp);

        // 确定攻击动作方向
        var dx = tp.x - fp.x;
        var dy = tp.y - fp.y;
        var mag = Math.sqrt(dx * dx + dy * dy);
        var dir = {x:dx/mag, y:dy/mag};

        // 延攻击方向移动距离
        var dist = 50;
        var mx = fp.x + dir.x * dist;
        var my = fp.y + dir.y * dist;

        await AniUtils.aniFact.createAniByCfg({type:"seq", arr: [ // 一个动画序列
            {type:"tr", fx:fp.x, fy:fp.y, tx:mx, ty:my, time:100, mode:egret.Ease.quintIn}, // 先冲过去
            {type:"tr", fx:mx, fy:my, tx:fp.x, ty:fp.y, time:100, mode:egret.Ease.quintOut}, // 再退回来
        ]}, obj);

        rev();
    }

    // 悬浮效果
    public static async floating(obj:egret.DisplayObject) {
        var fp = {x:obj.x, y:obj.y};
        var tp = {x:fp.x, y:fp.y - 25};
        var aniCfg = {type:"seq", loop:100, arr:[
            {type:"tr", fx:fp.x, fy:fp.y, tx:tp.x, ty:tp.y, time:750, mode:egret.Ease.quadInOut, manuallyStart:true, noWait:true},
            {type:"tr", fx:tp.x, fy:tp.y, tx:fp.x, ty:fp.y, time:750, mode:egret.Ease.quadInOut, manuallyStart:true, noWait:true},
        ], manuallyStart:true, noWait:true};

        var createAni = () => {
            var aw = AniUtils.aniFact.createAniByCfg(aniCfg, obj);
            aw["onEnded"].push(() => {
                createAni();
            });
            return aw;
        };

        return createAni();
    }

    // 清除所有相关动画
    public static clearAll(obj:egret.DisplayObject) {
        egret.Tween.removeTweens(obj);
    }
}
