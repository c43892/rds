// 将 player 设置为某职业
class Occupation {

    public static makeOccupation(p:Player):Player {
        var c = Occupation.creators[p.occupation];
        Utils.assert(c, "no such occupation: " + p.occupation);
        p.clear();
        p.mountBuffLogicPoint();
        p.buffs.push(new BuffDeathGod(p));
        return c(p);
    }

    static creators = {
        "nurse": Occupation.createNurse
    }
    
    // 护士
    static createNurse(p:Player):Player {
        // 每关起始加一瓶血
        p.onLevelInited.push(async () => {
            var bt = p.bt();
            // 随机找个揭开了的空白格子
            var g = BattleUtils.findRandomEmptyGrid(bt);
            if (g) {
                var hpPotion = ElemFactory.create("HpPotion", bt, {dhp:10});
                await Utils.delay(1000);
                await bt.implAddElemAt(hpPotion, g.pos.x, g.pos.y);
            }
        });

        // 离开关卡时恢复生命
        p.onGoOutLevel.push(async () => { await p.bt().implAddPlayerHp(5); });

        // 使用血瓶时加成
        p["forHpPotion"] = {a:0, b:0, c:1};

        return p;
    }
}
