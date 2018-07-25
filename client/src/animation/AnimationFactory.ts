
// 动画工厂
class AnimationFactory {

    public notifyAniStarted;

    // 创建指定类型的动画
    public createAni(aniType:string, ps = undefined):Promise<void> {
        var ani:Promise<void>;
        switch (aniType) {
            case "elemChanged": ani = this.monsterChanged(ps.m); break;
            case "playerChanged": ani = this.playerChanged(); break;
            case "playerAttackMonster": ani = this.playerAttackMonster(); break;
            case "monsterAttackPlayer": ani = this.monsterAttackPlayer(); break;
            case "moving": ani = this.moving(ps.obj, ps.path); break;
            case "fadeIn": ani = this.fade(ps.img, 0, 1, ps.time); break;
            case "fadeOut": ani = this.fade(ps.img, 1, 0, ps.time); break;
            case "moneyMoving": ani = Utils.delay(100); break;
            case "suckBlood": ani = Utils.delay(100); break;
            case "monsterTakeElem": ani = Utils.delay(100); break;
            case "gridBlocked": ani = this.fadeIn(ps.img, ps); break;
            case "cycleMask": ani = this.cycleMask(ps.img, ps); break;
        }
        
        Utils.assert(ani != undefined, "unknown aniType: " + aniType);
        if (ps && !ps.noWait)
            this.notifyAniStarted(ani, aniType, ps);

        return ani;
    }

    // 创建按指定路径移动的动画
    moving(g:egret.DisplayObject, path):Promise<void> {
        var tw = egret.Tween.get(g);
        for (var pt of path) {
            var x = pt.x;
            var y = pt.y;
            tw = tw.to({x:x, y:y}, 250, egret.Ease.quintInOut);
        }

        return new Promise<void>((resolve, reject) => tw.call(resolve));
    }

    // 指定对象的 alpha 渐变
    fade(g:egret.Bitmap, alphaFrom:number, alphaTo:number, time:number) {
        var tw = egret.Tween.get(g);
        g.alpha = alphaFrom;
        tw.to({alpha:alphaTo}, time, egret.Ease.quintOut);
        return new Promise<void>((resolve, reject) => tw.call(resolve));
    }

    // 创建怪物攻击玩家角色的特效
    monsterAttackPlayer():Promise<void> {
        return Utils.delay(100);
    }

    // 创建玩家角色攻击怪物的特效
    playerAttackMonster():Promise<void> {
        return Utils.delay(100);
    }

    // 玩家角色属性变化
    playerChanged():Promise<void> {
        return Utils.delay(100);
    }

    // 怪物属性变化
    monsterChanged(m:Monster):Promise<void> {
        return Utils.delay(100);
    }

    // 渐显
    fadeIn(g:egret.Bitmap, ps):Promise<void> {
        // properties from
        g.alpha = ps.fa ? ps.fa : g.alpha;
        g.x = ps.fx ? ps.fx : g.x;
        g.y = ps.fy ? ps.fy : g.y;
        g.width = ps.fw ? ps.fw : g.width;
        g.height = ps.fh ? ps.fh : g.height;

        // properties to
        var x = ps.tx ? ps.tx : g.x;
        var y = ps.ty ? ps.ty : g.y;
        var w = ps.tw ? ps.tw : g.width;
        var h = ps.th ? ps.th : g.height;
        var a = ps.ta ? ps.ta : g.alpha;
        var time = ps.time;

        var tw = egret.Tween.get(g);
        tw.to({x:x, y:y, width:w, height:h, alpha:a}, time, egret.Ease.backIn);
        return new Promise<void>((resolve, reject) => tw.call(resolve));
    }

    // 环形转圈
    cycleMask(g:egret.Bitmap, ps) : Promise<void> {
        var r = ps.r;
        var x = ps.x;
        var y = ps.y;
        
        g.alpha = ps.fa ? ps.fa : g.alpha;
        g["p"] = 0;

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
        var tw = egret.Tween.get(g, { onChange:() => refresh(g["p"]) });
        tw.to({alpha:a, p:1}, time);
        return new Promise<void>((resolve, reject) => tw.call(() => {
            shape.parent.removeChild(shape);
            resolve();
        }));
    }
}
