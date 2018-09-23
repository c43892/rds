
class AniUtils {
    public static ac:egret.DisplayObjectContainer;
    public static wait4clickImpl;
    public static aniFact:AnimationFactory;
    public static rand = new SRandom();

    public static reserveObjTrans(obj:egret.DisplayObject, ...poses) {
        var parent = obj.parent;
        var childIndex = parent.getChildIndex(obj);
        var x = obj.x;
        var y = obj.y;
        var wp = obj.localToGlobal();
        var ax = obj.anchorOffsetX;
        var ay = obj.anchorOffsetY;
        if (!(obj instanceof egret.MovieClip)) {
            obj.anchorOffsetX = obj.width * obj.scaleX / 2;
            obj.anchorOffsetY = obj.height * obj.scaleY / 2;
        }
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
            parent.setChildIndex(obj, childIndex);
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
        ], obj:obj});
        
        rev();
    }

    // 怪物从地下冒出来的效果
    public static async crawlOut(obj:egret.DisplayObject) {
        var rev = AniUtils.reserveObjTrans(obj);
        
        await this.aniFact.createAniByCfg({type:"tr", 
            fx:obj.x, fy:obj.y + 50,
            tx:obj.x, ty:obj.y,
            fa:0, ta:1, time:250, mode:egret.Ease.circOut, obj:obj});

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
                    {type:"tr", fy:fromPos.y, ty:midY, time:350, mode:egret.Ease.sineOut},
                    {type:"tr", fx:fromPos.x, tx:midX, time:350},
                ]},
                {type:"gp", arr: [
                    {type:"tr", fy:midY, ty:obj.y, time:350, mode:egret.Ease.sineIn},
                    {type:"tr", fx:midX, tx:obj.x, time:350},
                ]},
            ]}, 
            {type:"tr", fr:0, tr:tr, time:700},
            {type:"tr", fa:0, ta:1, time:200},
        ], obj:obj});

        rev();
    }

    // 用逻辑坐标来计算 FlyOut 的位置
    public static async flyOutLogicPos(obj:egret.DisplayObject, mv:MapView, fromLogicPos, toLogicPos = undefined) {
        await AniUtils.flyOut(obj, 
            mv.getGridViewAt(fromLogicPos.x, fromLogicPos.y).localToGlobal(), 
            toLogicPos ? mv.getGridViewAt(toLogicPos.x, toLogicPos.y).localToGlobal() : undefined);
    }

    // 加速直线从一个位置飞向目标位置，并在目标位置固定住。比如获得遗物或者物品的效果
    public static async fly2(obj:egret.DisplayObject, from:egret.DisplayObject, to:egret.DisplayObject, withFlash, toAlpha, noRotation = false) {
        // 飞行开始和目标位置
        var fp = from.localToGlobal();
        var tp = to.localToGlobal();
        var toObjScale = ViewUtils.getGlobalScale(to);
        tp.x = tp.x - to.anchorOffsetX + to.width * toObjScale.scaleX / 2;
        tp.y = tp.y - to.anchorOffsetY + to.height * toObjScale.scaleY / 2;

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
        var sx = to.width * toObjScale.scaleX / from.width;
        var sy = to.height * toObjScale.scaleY / from.height;

        await aniFact.createAniByCfg({type:"seq", arr: [ // 一个动画序列
            {type:"seq", arr: [ // 移动过程，也是一个序列
                {type:"gp", arr: [
                    {type:"tr", fy:fp.y, ty:my, time:250, tsx:msx, tsy:msy, mode:egret.Ease.quartOut}, // 微微放大抬起来
                    {type:"tr", fr:0, tx:mx, tr:mr, time:250}, // 伴随旋转
                ]},
                {type:"gp", arr: [
                    {type:"tr", fy:my, ty:tp.y, time:250, fsx:msx, fsy:msy, tsx:sx, tsy:sy, mode:egret.Ease.quadIn}, // 飞向目标
                    {type:"tr", fr:mr, tr:tr, fx:mx, tx:tp.x, ta:toAlpha, time:250}, // 伴随旋转
                ]},
            ]}, 
            {type:"tr", fa:1, ta:withFlash?3:1, time:withFlash?300:0, mode:egret.Ease.quadOut}, // 颜色反白
            {type:"tr", fa:withFlash?3:1, ta:1, time:withFlash?100:1, mode:egret.Ease.quadOut}, // 颜色恢复
        ], obj:obj});

        rev();
    }

    // 向给定目标抖一下，类似一个怪物的攻击动作
    public static async shakeTo(obj:egret.DisplayObject, targetPos = undefined) {
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
        ], obj:obj});

        rev();
    }

    // 悬浮效果
    public static async floating(obj:egret.DisplayObject, stopFloating = false) {
        if (stopFloating) {
            this.clearAll(obj);
            obj.x = 0;
            obj.y = 0;
        } else {
            var fp = {x:obj.x, y:obj.y};
            var tp = {x:fp.x, y:fp.y - 25};
            var aniCfg = {type:"seq", arr:[
                {type:"tr", fx:fp.x, fy:fp.y, tx:tp.x, ty:tp.y, time:750, mode:egret.Ease.quadInOut, noWait:true},
                {type:"tr", fx:tp.x, fy:tp.y, tx:fp.x, ty:fp.y, time:750, mode:egret.Ease.quadInOut, noWait:true},
            ], noWait:true, obj:obj};

            var createAni = () => {
                var aw = AniUtils.aniFact.createAniByCfg(aniCfg);
                aw["onEnded"].push(createAni);
                return aw;
            };

            return createAni();
        }
    }

    // 原地转动一下
    public static async rotate(obj:egret.DisplayObject) {
        var rev = AniUtils.reserveObjTrans(obj);
        await AniUtils.aniFact.createAniByCfg({type:"tr", fr:0, tr:90, time:100, noWait:true, obj:obj});
        rev();
    }

    // 原地转动一下再恢复，比如警棍在玩家攻击时的效果
    public static async rotateAndBack(obj:egret.DisplayObject) {
        var rev = AniUtils.reserveObjTrans(obj);
        await AniUtils.aniFact.createAniByCfg({type:"seq", arr:[
            {type:"tr", fr:0, tr:90, time:100, noWait:true},
            {type:"tr", fr:90, tr:0, time:100, noWait:true},
        ], noWait:true, obj:obj})
        rev();
    }

    // 模拟反转效果
    public static async turnover(obj:egret.DisplayObject, onMiddle) {
        var rev = AniUtils.reserveObjTrans(obj);
        var sx = obj.scaleX;
        var y = obj.y;
        await AniUtils.aniFact.createAniByCfg({type:"seq", arr:[
            {type:"tr", fsx:sx, tsx:0, fy:y, ty:y-15, time:150, noWait:true},
            {type:"op", op:onMiddle},
            {type:"tr", fsx:0, tsx:sx, fy:y-15, ty:y, time:150, noWait:true},
        ], noWait:true, obj:obj});
        rev();
    }

    // 闪烁消失
    public static async flashOut(obj:egret.DisplayObject) {
        await AniUtils.aniFact.createAniByCfg({type:"seq", arr:[
            {type:"tr", fa:1, ta:3, time:100},
            {type:"tr", fa:3, ta:1, time:100},
            {type:"tr", fa:1, ta:3, time:80},
            {type:"tr", fa:3, ta:1, time:80},
            {type:"tr", fa:1, ta:3, time:60},
            {type:"tr", fa:3, ta:1, time:60},
            {type:"tr", fa:1, ta:3, time:40},
            {type:"tr", fa:3, ta:1, time:40},
            {type:"tr", fa:1, ta:3, time:20},
            {type:"tr", fa:3, ta:1, time:20},
            {type:"tr", fa:1, ta:3, time:15},
            {type:"tr", fa:3, ta:1, time:15},
            {type:"tr", fa:1, ta:3, time:10},
            {type:"tr", fa:3, ta:1, time:10},
            {type:"tr", fa:1, ta:3, time:5},
        ], noWait:true, obj:obj})
    }

    // 在指定位置冒出一个文字提示
    public static async tipAt(str:string, pos, size = 30, color = 0x000000) {
        var tip = ViewUtils.createTextField(size, color);
        tip.textFlow = ViewUtils.fromHtml(str);
        AniUtils.ac.addChild(tip);
        tip.anchorOffsetX = tip.width / 2;
        tip.x = pos.x;
        tip.y = pos.y;
        await AniUtils.aniFact.createAniByCfg({type:"seq", arr:[
            {type:"tr", fa:0, ta:1, fy:pos.y, ty:pos.y-25, time:150, noWait:true},
            {type:"delay", time:700, noWait:true},
            {type:"tr", fa:1, ta:0, fy:pos.y-25, ty:pos.y-50, time:150, noWait:true}
        ], obj:tip, noWait:true});
        AniUtils.ac.removeChild(tip);
    }

    

    // 闪烁一下，比如满血的时候吃食物，表示食物不能使用的效果
    public static async flash(obj:egret.DisplayObject, t:number) {
        var x = obj.x;
        await AniUtils.aniFact.createAniByCfg({type:"seq", arr:[
            {type:"tr", fa:1, ta:3, time:t},
            {type:"tr", fa:3, ta:1, time:t},
        ], noWait:true, obj:obj})
    }

    // 闪一下并抖一下
    public static async flashAndShake(obj:egret.DisplayObject) {
        var x = obj.x;
        await AniUtils.aniFact.createAniByCfg({type:"seq", arr:[
            {type:"tr", fa:1, ta:3, fx:x, tx:x-5, time:50},
            {type:"tr", fa:3, ta:1, fx:x-5, tx:x+5, time:50},
            {type:"tr", fa:1, ta:3, fx:x+5, tx:x-5, time:50},
            {type:"tr", fa:3, ta:1, fx:x-5, tx:x, time:50},
        ], obj:obj});
    }

    // 震动一下镜头
    public static async shakeCamera(times:number = 2, interval:number = 100, autoClear:boolean = true) {
        await AniUtils.aniFact.createAniByCfg({type:"shakeCamera", times:times, interval:interval});
        if (autoClear)
            egret.Tween.removeTweens(ViewUtils.MainArea.parent);
    }

    // 向右跳动着飘一个提示
    public static async jumpingTip(str:string, pos) {
        var tip = ViewUtils.createTextField(30, 0x000000);
        tip.textFlow = ViewUtils.fromHtml(str);
        AniUtils.ac.addChild(tip);
        var x = pos.x;
        var y = pos.y;
        tip.x = x;
        tip.y = y;
        await AniUtils.aniFact.createAniByCfg({type:"seq", arr:[
            {type:"gp", arr:[
                {type:"tr", fa:0, ta:1, time:100, noWait:true},
                {type:"tr", fx:x, tx:x+25, time:200, noWait:true},
                {type:"tr", fy:y, ty:y+50, time:200, mode:egret.Ease.sineIn, noWait:true}
            ], noWait:true},
            {type:"gp", arr:[
                {type:"tr", fx:x+25, tx:x+50, time:200, noWait:true},
                {type:"tr", fy:y+50, ty:y, time:200, mode:egret.Ease.sineOut, noWait:true}
            ], noWait:true},
            {type:"gp", arr:[
                {type:"tr", fx:x+50, tx:x+75, time:200, noWait:true},
                {type:"tr", fy:y, ty:y+50, time:200, mode:egret.Ease.sineIn, noWait:true}
            ], noWait:true},
            {type:"gp", arr:[                
                {type:"tr", fa:1, ta:0, fx:x+75, tx:x+100, time:200, noWait:true},
                {type:"tr", fy:y+50, ty:y, time:200, mode:egret.Ease.sineOut, noWait:true}
            ], noWait:true},
        ], obj:tip, noWait:true});
        AniUtils.ac.removeChild(tip);
    }

    // 爆出来一个提示
    public static async popupTipAt(str:string, bgTex:string, pos) {
        var bg = ViewUtils.createBitmapByName(bgTex);
        bg.anchorOffsetX = bg.width / 2;
        bg.anchorOffsetY = bg.height / 2;
        bg.x = pos.x;
        bg.y = pos.y;
        AniUtils.ac.addChild(bg);
        var tip = ViewUtils.createTextField(25, 0xffffff);
        tip.textAlign = egret.HorizontalAlign.CENTER;
        tip.verticalAlign = egret.VerticalAlign.MIDDLE;
        tip.textFlow = ViewUtils.fromHtml(str);
        tip.x = pos.x;
        tip.y = pos.y;
        tip.width = bg.width;
        tip.height = bg.height;
        AniUtils.ac.addChild(tip);
        tip.anchorOffsetX = tip.width / 2;
        tip.anchorOffsetY = tip.height / 2;
        await AniUtils.aniFact.createAniByCfg({type:"seq", arr:[
            {type:"gp", arr:[
                {type:"tr", fa:0, ta:1, time:100, obj:tip, noWait:true},
                {type:"tr", fa:0, ta:1, time:100, obj:bg, noWait:true},
                {type:"tr", fsx:0, tsx:1, fsy:0, tsy:1, time:100, obj:tip, noWait:true, mode:egret.Ease.quadIn},
                {type:"tr", fsx:0, tsx:1, fsy:0, tsy:1, time:100, obj:bg, noWait:true, mode:egret.Ease.quadIn},
            ], noWait:true},
            {type:"delay", obj:tip, time:500, noWait:true}
        ], noWait:true});
        AniUtils.ac.removeChild(bg);
        AniUtils.ac.removeChild(tip);
    }

    public static async delay(time) {
        await AniUtils.aniFact.createAni("delay", {obj:AniUtils.ac, time:time});
    }

    // 直线飞向目标位置并消失
    public static async flyAndFadeoutArr(objArr:egret.DisplayObject[], toPos, time, toScale, toAlpha, toRotation, mode) {
        var aniArr = [];
        var revArr = []
        objArr.forEach((obj, i) => {
            revArr.push(AniUtils.reserveObjTrans(obj, toPos));
            aniArr.push(AniUtils.aniFact.createAniByCfg({
                type:"tr", tx:toPos.x, ty:toPos.y, ta:toAlpha, tr:toRotation, tsx:toScale, tsy:toScale,
                time:time, obj:obj, mode:mode
            }));
        });

        await AniUtils.aniFact.createAni("gp", {subAniArr:aniArr});
        revArr.forEach((rev, _) => {
            rev();
        });

        objArr.forEach((obj, _) => {
            obj.alpha = 0;
        });
    }

    public static async flyAndFadeout(obj:egret.DisplayObject, toPos, time, toScale, toAlpha, toRotation, mode) {
        await AniUtils.flyAndFadeoutArr([obj], toPos, time, toScale, toAlpha, toRotation, mode);
    }

    // 所有元素随机移动并不等待动画
    public static LoopMoveAll(gs:egret.DisplayObject[], mapview:MapView) {
        var revArr = [];
        var speed = 1;
        gs.forEach((g, _) => {
            var fromPos = mapview.getGridViewAt(g["gx"], g["gy"]).localToGlobal();
            var toPos1 = mapview.getGridViewAt(g["tgx1"], g["tgy1"]).localToGlobal();
            var toPos2 = mapview.getGridViewAt(g["tgx2"], g["tgy2"]).localToGlobal();
            var toPos3 = mapview.getGridViewAt(g["tgx3"], g["tgy3"]).localToGlobal();
            var parent = g.parent;
            AniUtils.ac.addChild(g);
            revArr.push(() => parent.addChild(g));
            var delay1 = g["delay1"];
            var delay2 = g["delay2"];
            var delay3 = g["delay3"];
            var delay4 = g["delay4"];
            var t1 = Utils.getDist(fromPos, toPos1) / speed;
            var t2 = Utils.getDist(toPos1, toPos2) / speed;
            var t3 = Utils.getDist(toPos2, toPos3) / speed;
            var t4 = Utils.getDist(toPos3, fromPos) / speed;
            egret.Tween.get(g, {loop:true}).to({x:fromPos.x, y:fromPos.y}, 0)
                .to({x:toPos1.x, y:toPos1.y}, t1, egret.Ease.circOut).to({}, delay1)
                .to({x:toPos2.x, y:toPos2.y}, t2, egret.Ease.circOut).to({}, delay2)
                .to({x:toPos3.x, y:toPos3.y}, t3, egret.Ease.circOut).to({}, delay3)
                .to({x:fromPos.x, y:fromPos.y}, t4, egret.Ease.circOut).to({}, delay4);
        });

        return revArr;
    }

    // 开场盖住所有格子
    public static async coverAll(mapView:MapView) {
        // 牌背随机从四面八方飞过来盖住
        var eachTime = 1000;
        var mapsize = GCfg.mapsize;
        var gbgs:egret.Bitmap[] = [];
        for (var x = 0; x < mapsize.w; x++) {
            for (var y = 0; y < mapsize.h; y++) {
                var bg = ViewUtils.createBitmapByName("covered_png");
                bg["rn"] = Math.abs(x - mapsize.w) + y;
                bg["fgx"] = mapsize.w;
                bg["fgy"] = 0;
                bg["gx"] = x;
                bg["gy"] = y;
                AniUtils.ac.addChild(bg);
                gbgs.push(bg);                
            }
        }

        // 排序
        gbgs.sort((g1, g2) => {
            var x1 = g1["rn"];
            var x2 = g2["rn"];
            if(x1 < x2)
                return 1;
            else if(x1 > x2)
                return -1;
            else
                return 0;
        });

        // 构建单个动画
        var aniArr = [];
        gbgs.forEach((g, i) => {
            var delay = i * eachTime / 30;
            var fromPos = mapView.logicPos2ShowPos(g["fgx"], g["fgy"]);
            fromPos = mapView.localToGlobal(fromPos.x, fromPos.y);
            g.x = fromPos.x;
            g.y = fromPos.y;
            var toPos = mapView.logicPos2ShowPos(g["gx"], g["gy"]);
            toPos = mapView.localToGlobal(toPos.x, toPos.y);
            var ani = this.aniFact.createAniByCfg({type:"seq", obj:g, arr:[
                {type:"delay", time:delay},
                {type:"tr", fx:fromPos.x, fy:fromPos.y, tx:toPos.x, ty:toPos.y, time:eachTime*Math.sqrt(bg["rn"])/10}
            ]});
            aniArr.push(ani);
        });

        // 把所有动画组合起来
        var ani = this.aniFact.createAni("gp", {subAniArr:aniArr});
        await ani;
        await AniUtils.delay(1000);
        gbgs.forEach((g, _) => {
            AniUtils.ac.removeChild(g);
        });
    }

    // 等待点击
    public static async wait4click() {
        await AniUtils.wait4clickImpl();
    }

    // 阻挡点击操作
    public static blockClick() {
        var av = <AniView>AniUtils.ac;
        Utils.assert(!!av, "need AniView layer");
        av.addBlockLayer();
        return () => av.decBlockLayer();
    }

    // 创建一个只用于动画显示的图片
    public static createImg(texName:string) {
        var img = ViewUtils.createBitmapByName(texName);
        AniUtils.ac.addChild(img);
        img["dispose"] = () => AniUtils.ac.removeChild(img);
        return img;
    }

    // 经验光效飞行轨迹
    public static createExpTrack(bcw:BazierControllerWrapper, fromPos, toPos, time, endDelay = 0) {
        var r = AniUtils.rand.nextDouble() / 2 + 0.25;
        var cx = fromPos.x + (toPos.x - fromPos.x) * r;
        var cy = fromPos.y + (toPos.y - fromPos.y) * r;
        var dir = Utils.getRotationFromTo(fromPos, toPos);
        dir += 90;
        r = (AniUtils.rand.nextDouble() - 0.5) * Utils.getDist(fromPos, toPos) / 2;
        var dx = r * Math.cos(dir);
        var dy = r * Math.sin(dir);
        var controlPos = {x:cx + dx, y:cy + dy};
        Utils.log("+ " + bcw["idd"]);
        return AniUtils.aniFact.createAniByCfg({type:"seq", arr:[
            {type:"bezierTrack", fromPos:fromPos, controlPos:controlPos, toPos:toPos, time:time},
            {type:"delay", time:time},
        ], obj:bcw, noWait:true});
    }

    // 清除所有相关动画
    public static clearAll(obj:egret.DisplayObject) {
        egret.Tween.removeTweens(obj);
    }
}
