// 动画工厂
class AnimationFactory {

    public notifyAniStarted;

    public constructor() {
        egret.Ticker.getInstance().register((advancedTime) => dragonBones.WorldClock.clock.advanceTime(advancedTime/1000), this);
    }

    /*
        一个动画需要指明一个 type 和一组参数
        可用的 type 有：
            "tr": 完成移动，旋转，缩放，透明度变化
                : f* 表示起始值，t* 标是目标值
                : *x 是坐标 x，*y 是坐标 y，*w 是宽，*h 是高，*r 是旋转角度，*a 是透明度，*sx 是横轴缩放，*sy 是纵轴缩放
                : 例如：{type:"tr", fx:0, fy:0, tx:100, ty:100, fr:0, tr:360} 标是从 {0, 0} 移动到 {100, 100} 同时旋转一周
                : 参数 mode 是 egret.ease 曲线类型，默认是线性，参数 time 是动画持续时间，单位是毫秒
            "delay": 延迟一段时间
                : 参数 time 是动画持续时间，单位是毫秒
            "moveOnPath": 沿着给定路径移动
                : path 是一组形如 {x:x, y:y} 的数组，表示路径点坐标
                : 参数 mode 是 egret.ease 曲线类型，默认是线性，作用于每一格移动，参数 time 也是每移动一格所需的时间，单位是毫秒
            "seq": 一组顺序播放的动画
                : arr 是一个动画数组，该组动画将被顺序播放，最后一个动画的完成时，整个动画序列完成
            "gp": 一组同时播放的动画
                : arr 是一个动画数组，该组动画将同时播放，以最晚结束的动画时间算最终完成时间
    */

    public createAniByCfg(cfg):Promise<void> {
        if (cfg.type == "seq" || cfg.type == "gp") {
            var aniArr = [];
            var defaultObj = cfg.obj;
            var defaultObjs = cfg.objs;
            for (var subCfg of cfg.arr) {
                if (!subCfg.obj)
                    subCfg.obj = defaultObj;
                
                if (!subCfg.objs)
                    subCfg.objs = defaultObjs;

                subCfg.manuallyStart = true; // 子动画都不是自动播放，要等待顶层动画对象通知播放
                subCfg.noWait = subCfg.noWait || cfg.noWait;
                var subAni = this.createAniByCfg(subCfg);
                aniArr.push(subAni);
            }
            Utils.assert(aniArr.length > 0, "no subanis in " + cfg.type);
            cfg.subAniArr = aniArr;
            return this.createAni(cfg.type, cfg);
        } else {
            return this.createAni(cfg.type, cfg);
        }
    }

    // 创建指定类型的动画
    public createAni(aniType:string, ps = undefined):Promise<void> {
        var aw;
        var aws;
        if (aniType == "seq")
            aw = this.aniSeq(ps.subAniArr);
        else if (aniType == "gp")
            aw = this.aniGroup(ps.subAniArr);
        else if (aniType == "skeleton")
            aw = this.skeleton(ps);
        else {

            var objs = [];
            if (ps.objs) objs.push(...ps.objs);
            if (ps.obj) objs.push(ps.obj);

            var anis:egret.Tween[];
            switch (aniType) {
                case "delay": anis = this.trans(objs, {time:ps.time}); break;
                case "tr": anis = this.trans(objs, ps); break;
                case "op": anis = this.op(objs, ps.delay, ps.op); break;
                case "moveOnPath": anis = this.moveOnPath(objs, ps); break;
                case "cycleMask": anis = this.cycleMask(objs, ps); break;
                case "bezierTrack": anis = this.bezierTrack(objs, ps); break;
                case "shakeCamera": anis = [this.shakeCamera(ps.times, ps.interval)]; break;
                default: Utils.log("unknown aniType: " + aniType);
            }

            if (anis.length > 1)
                aws = Utils.map(anis, (ani) => {
                    let aw = ani ? new Promise<void>((r, _) => ani.call(r)) : Utils.delay(1);
                    aw["ani"] = ani;
                    return aw;
                });
            else {
                aw = anis[0] ? new Promise<void>((r, _) => anis[0].call(r)) : Utils.delay(1);
                aw["ani"] = anis[0];
            }
        }

        var wrapAW = (_aw) => {
            let ani = _aw["ani"];
            _aw["name"] = (ps && ps.name) ? ps.name : undefined;
            _aw["onStarted"] = [
                // () => Utils.log("ani: " + _aw["name"] + " started"),
            ];
            
            _aw["onEnded"] = [
                // () => Utils.log("ani: " + _aw["name"] + " ended"),
            ];

            var notifyStart = ps && !ps.noWait;
            _aw["start"] = () => {
                for (var cb of _aw["onStarted"]) cb();
                if (ani) ani.setPaused(false);
                else if (_aw["startimpl"]) _aw["startimpl"]();
                if (notifyStart && this.notifyAniStarted) this.notifyAniStarted(_aw, aniType, ps);
            };

            _aw["pause"] = () => {
                // Utils.log("ani: " + _aw["name"] + " paused");
                if (ani) ani.setPaused(true);
                else if (_aw["pauseimpl"]) _aw["pauseimpl"]();
            };

            _aw["stop"] = () => {
                if (ani) egret.Tween.removeTweens(ps.obj);
                else if (_aw["stopimpl"]) _aw["stopimpl"]();
            };

            // 不要自动播放
            if (ani && ps.manuallyStart)
                _aw["pause"]();
            else // 自动播放
                _aw["start"]();
            
            _aw.then(() => {
                for (var cb of _aw["onEnded"])
                    cb()
            });

            return _aw;
        };

        return aws ? wrapAW(this.aniGroup(Utils.map(aws, (_aw) => wrapAW(_aw)))) : wrapAW(aw);
    }

    // 创建按指定路径移动的动画
    moveOnPath(objs:egret.DisplayObject[], ps):egret.Tween[] {
        return Utils.map(objs, (g) => {
            let tw = egret.Tween.get(g);
            let t = ps.time ? ps.time : 1000;
            for (var pt of ps.path) {
                var x = pt.x;
                var y = pt.y;
                tw = tw.to({x:x, y:y}, t, ps.mode);
            }

            return tw;
        });
    }

    // 渐隐渐显
    public trans(objs:egret.DisplayObject[], ps):egret.Tween[] {
        // properties from
        var psf = {};
        if (ps.fx != undefined) psf["x"] = ps.fx;
        if (ps.fy != undefined) psf["y"] = ps.fy;
        if (ps.fw != undefined) psf["width"] = ps.fw;
        if (ps.fh != undefined) psf["height"] = ps.fh;
        if (ps.fsx != undefined) psf["scaleX"] = ps.fsx;
        if (ps.fsy != undefined) psf["scaleY"] = ps.fsy;
        if (ps.fa != undefined) psf["alpha"] = ps.fa;
        if (ps.fr != undefined) psf["rotation"] = ps.fr;
        if (ps.fskx != undefined) psf["skewX"] = ps.fskx;
        if (ps.fsky != undefined) psf["skewY"] = ps.fsky;

        var pst = {};
        if (ps.tx != undefined) pst["x"] = ps.tx;
        if (ps.ty != undefined) pst["y"] = ps.ty;
        if (ps.tw != undefined) pst["width"] = ps.tw;
        if (ps.th != undefined) pst["height"] = ps.th;
        if (ps.tsx != undefined) pst["scaleX"] = ps.tsx;
        if (ps.tsy != undefined) pst["scaleY"] = ps.tsy;
        if (ps.ta != undefined) pst["alpha"] = ps.ta;
        if (ps.tr != undefined) pst["rotation"] = ps.tr;
        if (ps.tskx != undefined) pst["skewX"] = ps.fskx;
        if (ps.tsky != undefined) pst["skewY"] = ps.fsky;

        return Utils.map(objs, (g) => {
            Utils.assert(!!g, "the transform object should not be undefined");
            var t = ps.time != undefined ? ps.time : 1000;
            return egret.Tween.get(g).to(psf, 0).to(pst, t, ps.mode);
        });
    }

    // 环形转圈
    cycleMask(objs:egret.DisplayObject[], ps):egret.Tween[] {
        var r = ps.r;
        var x = ps.x;
        var y = ps.y;

        var tws = [];

        for (var g of objs) {

            g.alpha = ps.fa != undefined ? ps.fa : g.alpha;
            g["$$TweenAniFactor"] = 0;

            var shape = new egret.Shape();
            g.mask = shape;
            g.parent.addChild(shape);
            var refresh = (p) => {
                var arc = p * Math.PI * 2;            
                shape.graphics.clear();
                shape.graphics.beginFill(0xffffff);
                shape.graphics.moveTo(x, y);
                shape.graphics.lineTo(x + r, y);
                shape.graphics.drawArc(x, y, r, 0, arc);
                shape.graphics.lineTo(x + Math.cos(arc) * r, y + Math.sin(arc) * r);
                shape.graphics.endFill();
            };

            var a = ps.ta ? ps.ta : g.alpha;
            var time = ps.time;
            refresh(0);
            var tw = egret.Tween.get(g, { onChange:() => refresh(g["$$TweenAniFactor"]) });
            tw.to({alpha:a, p:1}, time).call(() => shape.parent.removeChild(shape));
            tws.push(tw);
        }

        return tws;
    }

    // 贝塞尔轨迹
    bezierTrack(objs, ps):egret.Tween[] {
        var fromPos = ps.fromPos;
        var controlPos = ps.controlPos;
        var toPos = ps.toPos;
        return Utils.map(objs, (obj) => {
            obj.setBazierPoints(fromPos, controlPos, toPos);
            return egret.Tween.get(obj).to({"bezierFactor":0}, 0).to({"bezierFactor":1}, ps.time);
        });
    }

    // 屏幕震动
    shakeCamera(times, interval):egret.Tween {
        var root = ViewUtils.MainArea.parent;
        var x = root.x;
        var y = root.y;
        var tw = egret.Tween.get(root);
        for (var i = 0; i < times; i++) {
            var rdx1 = AniUtils.rand.nextInt(-10, 10);
            var rdy1 = AniUtils.rand.nextInt(-10, 10);
            var rdx2 = -AniUtils.rand.nextInt(-10, 10);
            var rdy2 = -AniUtils.rand.nextInt(-10, 10);
            tw = tw.to({"x":x+rdx1, "y":y+rdy1}, interval/2);
            tw = tw.to({"x":x+rdx2, "y":y+rdy2}, interval/2);
        }
        tw = tw.to({"x":x, "y":y}, 0);
        return tw;
    }

    // 动画序列
    aniSeq(subAnis:Promise<void>[]):Promise<void> {
        var aw;
        var curAni = subAnis[0];
        for (var i = 0; i < subAnis.length; i++) {
            subAnis[i]["pause"]();
            var iAni = subAnis[i];
            (() => subAnis[i]["onStarted"].push(() => curAni = iAni))();

            if (i < subAnis.length - 1)
                (() => subAnis[i]["onEnded"].push(subAnis[i + 1]["start"]))();
            else
                aw = new Promise<void>((r, _) => subAnis[subAnis.length - 1]["onEnded"].push(r));
        }

        aw["startimpl"] = () => {
            Utils.assert(subAnis.length > 0, "no sub ani in seq");
            subAnis[0]["start"]();
        };

        aw["pauseimpl"] = () => curAni["pause"]();
        aw["stopimpl"] = () => curAni["stop"]();

        return aw;
    }

    // 同时播放的动画组合
    aniGroup(subAnis:Promise<void>[]):Promise<void> {
        var aw = new Promise<void>((r, _) => {
            var endCnt = subAnis.length;
            for (var ani of subAnis) {
                ani["pause"]();
                (() => ani["onEnded"].push(() => {
                    endCnt--;
                    if (endCnt <= 0)
                        r();
                }))();
            }
        });

        aw["startimpl"] = () => {
            Utils.assert(subAnis.length > 0, "no sub ani in gp");
            for (var ani of subAnis)
                ani["start"]();
        };

        aw["pauseimpl"] = () => {
            for (var ani of subAnis)
                ani["pause"]();
        };

        aw["stopimpl"] = () => {
            for (var ani of subAnis)
                ani["stopimpl"]();
        };

        return aw;
    }

    // 执行指定动作
    op(objs:egret.DisplayObject[], delay, op):egret.Tween[] {
        return Utils.map(objs, (g) => {
            delay = delay ? delay : 0;
            return egret.Tween.get(g).wait(delay).call(() => op()).wait(0);
        });
    }

    // 龙骨动画
    skeleton(ps):Promise<void> {
        var ani:dragonBones.Armature;
        var skeName = ps.name;
        var actName = ps.act;
        var playTimes = ps.playTimes;

        var aw = new Promise<void>((r, _) => ani = ViewUtils.createSkeletonAni(skeName, () => r()));
        aw["startimpl"] = () => ani.animation.play(actName, playTimes);
        aw["pauseimpl"] = () => ani.animation.stop();
        aw["stopimpl"] = () => { ani.animation.stop(); dragonBones.WorldClock.clock.remove(ani); };
        aw["getDisplay"] = () => ani.display;
        aw["getArmature"] = () => ani;
        aw["play"] = async (act) => {
            return new Promise<void>((r, _) => {
                var onAniFinished;
                onAniFinished = (evt:dragonBones.AnimationEvent) => {
                    r();
                    ani.getDisplay().removeEventListener(dragonBones.AnimationEvent.COMPLETE, onAniFinished, this);
                    dragonBones.WorldClock.clock.remove(ani);
                };
                ani.getDisplay().addEventListener(dragonBones.AnimationEvent.COMPLETE, onAniFinished, this);
                ani.animation.play(actName, playTimes);
            });
        }

        return aw;
    }
}
