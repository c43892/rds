// 动画工厂
class AnimationFactory {

    public notifyAniStarted;

    public createAniByCfg(cfg):Promise<void> {
        if (cfg.type == "aniSeq" || cfg.type == "aniGroup") {
            var aniArr = [];
            for (var subCfg of cfg.ps) {
                var subAni = this.createAniByCfg(subCfg);
                aniArr.push(subAni);
            }
            return this.createAni(cfg.type, aniArr);
        } else
            return this.createAni(cfg.type, cfg.ps);
    }

    // 创建指定类型的动画
    public createAni(aniType:string, ps = undefined):Promise<void> {
        var aw;
        if (aniType == "aniSeq")
            aw = this.aniSeq(ps);
        else if (aniType == "aniGroup")
            aw = this.aniGroup(ps);
        else {
            var ani:egret.Tween;
            switch (aniType) {
                case "fade": ani = this.fade(ps.obj, ps); break;
                case "moving": ani = this.moving(ps.obj, ps); break;
                case "jumping": ani = this.jumping(ps.obj, ps); break;
                case "cycleMask": ani = this.cycleMask(ps.obj, ps); break;
            }

            if (!ani) Utils.log("unknown aniType: " + aniType);
            aw = ani ? new Promise<void>((r, _) => ani.call(r)) : Utils.delay(10);
        }
        
        aw["name"] = (ps && ps.name) ? ps.name : undefined;
        aw["ani"] = ani;
        aw["onStarted"] = [
            // () => Utils.log("ani: " + aw["name"] + " started"),
        ];
        aw["onEnded"] = [
            // () => Utils.log("ani: " + aw["name"] + " ended"),
        ];

        var notifyStart = ps && !ps.noWait;
        aw["start"] = () => {
            for (var cb of aw["onStarted"]) cb();
            if (ani) ani.setPaused(false);
            else if (aw["startimpl"]) aw["startimpl"]();
            if (notifyStart && this.notifyAniStarted) this.notifyAniStarted(aw, aniType, ps);
        };

        aw["pause"] = () => {
            // Utils.log("ani: " + aw["name"] + " paused");
            if (ani) ani.setPaused(true);
            else if (aw["pauseimpl"]) aw["pauseimpl"]();
        };

        // 不要自动播放
        if (ani && ps.manuallyStart)
            aw["pause"]();
        else // 自动播放
            aw["start"]();
        
        aw.then(() => {
            for (var cb of aw["onEnded"])
                cb()
        });

        return aw;
    }

    // 创建按指定路径移动的动画
    moving(g:egret.DisplayObject, ps):egret.Tween {
        var tw = egret.Tween.get(g);
        for (var pt of ps.path) {
            var x = pt.x;
            var y = pt.y;
            tw = tw.to({x:x, y:y}, 250, ps.mode);
        }

        return tw;
    }
    
    // 跳动一下
    jumping(g:egret.DisplayObject, ps):egret.Tween {

        // properties from
        var psf = {};
        if (ps.fy != undefined) psf["y"] = ps.fy;

        // properties to
        var pst = {};
        if (ps.ty != undefined) pst["y"] = ps.ty;

        return egret.Tween.get(g).to(psf, 0).to(pst, ps.time, egret.Ease.elasticOut);
    }

    // 渐隐渐显
    fade(g:egret.DisplayObject, ps):egret.Tween {
        // properties from
        var psf = {};
        if (ps.fx != undefined) psf["x"] = ps.fx;
        if (ps.fy != undefined) psf["y"] = ps.fy;
        if (ps.fw != undefined) psf["width"] = ps.fw;
        if (ps.fh != undefined) psf["height"] = ps.fh;
        if (ps.fa != undefined) psf["alpha"] = ps.fa;

        var pst = {};
        if (ps.tx != undefined) pst["x"] = ps.tx;
        if (ps.ty != undefined) pst["y"] = ps.ty;
        if (ps.tw != undefined) pst["width"] = ps.tw;
        if (ps.th != undefined) pst["height"] = ps.th;
        if (ps.ta != undefined) pst["alpha"] = ps.ta;

        return egret.Tween.get(g).to(psf, 0).to(pst, ps.time, ps.mode);
    }

    // 环形转圈
    cycleMask(g:egret.DisplayObject, ps):egret.Tween {
        var r = ps.r;
        var x = ps.x;
        var y = ps.y;
        
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
        return tw;
    }

    // 动画序列
    aniSeq(subAnis:Promise<void>[]):Promise<void> {
        var aw;
        var curAni;
        for (var i = 0; i < subAnis.length; i++) {
            subAnis[i]["pause"]();
            (() => subAnis[i]["onStarted"].push(() => curAni = subAnis[i]))();

            if (i < subAnis.length - 1)
                (() => subAnis[i]["onEnded"].push(subAnis[i + 1]["start"]))();
            else
                aw = new Promise<void>((r, _) => subAnis[subAnis.length - 1]["onEnded"].push(r));
        }

        aw["startimpl"] = () => subAnis[0]["start"]();
        aw["pauseimpl"] = () => curAni["pause"]();

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
            for (var ani of subAnis)
                ani["start"]();
        };

        aw["pauseimpl"] = () => {
            for (var ani of subAnis)
                ani["pause"]();
        };

        return aw;
    }
}
