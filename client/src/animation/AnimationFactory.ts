
// 动画工厂
class AnimationFactory {

    public notifyAniStarted;

    // 创建指定类型的动画
    public createAni(aniType:string, ps = undefined):Promise<void> {
        var ani:Promise<void>;
        switch (aniType) {
            case "monsterChanged": ani = this.monsterChanged(ps.m); break;
            case "playerChanged": ani = this.playerChanged(); break;
            case "playerAttackMonster": ani = this.playerAttackMonster(ps.m); break;
            case "monsterAttackPlayer": ani = this.monsterAttackPlayer(ps.m); break;
            case "moving": ani = this.moving(ps.img, ps.path); break;
        }
        
        Utils.assert(ani != undefined, "unknown aniType: " + aniType);
        this.notifyAniStarted(ani, aniType, ps);
        return ani;
    }

    // 创建按指定路径移动的动画
    moving(g:egret.DisplayObject, path:number[][]):Promise<void> {
        var tw = egret.Tween.get(g);
        for (var pt of path) {
            var x = pt[0];
            var y = pt[1];
            tw = tw.to({x:x, y:y}, 200);
        }

        return new Promise<void>((resolve, reject) => tw.call(resolve));
    }

    // 创建怪物攻击玩家角色的特效
    monsterAttackPlayer(m:Monster):Promise<void> {
        return Utils.delay(500);
    }

    // 创建玩家角色攻击怪物的特效
    playerAttackMonster(m:Monster):Promise<void> {
        return Utils.delay(500);
    }

    // 玩家角色属性变化
    playerChanged():Promise<void> {
        return Utils.delay(500);
    }

    // 怪物属性变化
    monsterChanged(m:Monster):Promise<void> {
        return Utils.delay(500);
    }
}
