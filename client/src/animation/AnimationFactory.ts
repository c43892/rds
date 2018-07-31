
// 动画工厂
class AnimationFactory {

    public notifyAniStarted;

    // 创建指定类型的动画
    public createAni(aniType:string, ps = undefined):Promise<void> {
        var ani:egret.Tween;
        switch (aniType) {
            case "elemChanged": ani = this.monsterChanged(ps.m); break;
            case "playerChanged": ani = this.playerChanged(); break;
            case "playerAttackMonster": ani = this.playerAttackMonster(); break;
            case "monsterAttackPlayer": ani = this.monsterAttackPlayer(); break;
            case "moving": ani = this.moving(ps.obj, ps.path); break;
            case "fade": ani = this.fade(ps.img, ps); break;
            case "moneyMoving": ani = undefined; break;
            case "suckBlood": ani = undefined; break;
            case "monsterTakeElem": ani = undefined; break;
            case "cycleMask": ani = this.cycleMask(ps.img, ps); break;
        }

        if (!ani) Utils.log("unknown aniType: " + aniType);
        
        var aw = ani ? new Promise<void>((resolve, rejrect) => ani.call(resolve)) : Utils.delay(10);
        if (ps && !ps.noWait)
            this.notifyAniStarted(aw, aniType, ps);

        return aw;
    }

    // 创建按指定路径移动的动画
    moving(g:egret.DisplayObject, path):egret.Tween {
        var tw = egret.Tween.get(g);
        for (var pt of path) {
            var x = pt.x;
            var y = pt.y;
            tw = tw.to({x:x, y:y}, 250, egret.Ease.quintInOut);
        }

        return tw;
    }

    // 创建怪物攻击玩家角色的特效
    monsterAttackPlayer():egret.Tween {
        // return Utils.delay(100);
        return undefined;
    }

    // 创建玩家角色攻击怪物的特效
    playerAttackMonster():egret.Tween {
        // return Utils.delay(100);
        return undefined;
    }

    // 玩家角色属性变化
    playerChanged():egret.Tween {
        // return Utils.delay(100);
        return undefined;
    }

    // 怪物属性变化
    monsterChanged(m:Monster):egret.Tween {
        // return Utils.delay(100);
        return undefined;
    }

    // 渐隐渐显
    fade(g:egret.DisplayObject, ps):egret.Tween {
        // properties from
        g.alpha = ps.fa != undefined ? ps.fa : g.alpha;
        g.x = ps.fx != undefined ? ps.fx : g.x;
        g.y = ps.fy != undefined ? ps.fy : g.y;
        g.width = ps.fw != undefined ? ps.fw : g.width;
        g.height = ps.fh != undefined ? ps.fh : g.height;

        // properties to
        var x = ps.tx != undefined ? ps.tx : g.x;
        var y = ps.ty != undefined ? ps.ty : g.y;
        var w = ps.tw != undefined ? ps.tw : g.width;
        var h = ps.th != undefined ? ps.th : g.height;
        var a = ps.ta != undefined ? ps.ta : g.alpha;
        var time = ps.time;

        var tw = egret.Tween.get(g);
        tw.to({x:x, y:y, width:w, height:h, alpha:a}, time, ps.mode);
        return tw;
    }

    // 环形转圈
    cycleMask(g:egret.Bitmap, ps):egret.Tween {
        var r = ps.r;
        var x = ps.x;
        var y = ps.y;
        
        g.alpha = ps.fa != undefined ? ps.fa : g.alpha;
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
        tw.to({alpha:a, p:1}, time).call(() => shape.parent.removeChild(shape));
        return tw;
    }
}
