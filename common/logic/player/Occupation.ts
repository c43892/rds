// 将 player 设置为某职业
class Occupation {
    public static makeOccupation(p:Player):Player {
        var c = Occupation.creators[p.occupation];
        Utils.assert(c, "no such occupation: " + p.occupation);
        p.clear();
        
        p.addBuff(new BuffBasic()); // 探空格+经验
        p.addBuff(new BuffDeathGod()); // 死神

        return c(p);
    }

    static creators = {
        "Nurse": Occupation.makeNurse,
        "Rogue": Occupation.makeRogue,
    }
    
    // 护士
    static makeNurse(p:Player):Player {
        p.addBuff(new BuffNurse()); // 职业buff
        p.addRelic(<Relic>ElemFactory.create("HorticultureMaster")); // 初始遗物
        p.addItem(<Prop>ElemFactory.create("HpCapsule")); // 初始物品
        return p;
    }

    // 流氓
    static makeRogue(p:Player):Player {
        return p;
    }
}
