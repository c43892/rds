// 将 player 设置为某职业
class Occupation {
    public static makeOccupation(p:Player):Player {
        var c = Occupation.creators[p.occupation];
        Utils.assert(c, "no such occupation: " + p.occupation);

        p = c(p);
        p = Occupation.addOccupationBuff(p);
        return p;
    }

    static creators = {
        "Nurse": Occupation.makeNurse,
        "Rogue": Occupation.makeRogue,
    }
    
    // 护士
    static makeNurse(p:Player):Player {
        p.addRelic(<Relic>ElemFactory.create("MedicineBox")); // 初始遗物
        p.addItem(<Prop>ElemFactory.create("HpCapsule")); // 初始物品
        return p;
    }

    // 流氓
    static makeRogue(p:Player):Player {
        return p;
    }

    static addOccupationBuff(p:Player){
        p.clear();
        p.addBuff(new BuffBasic()); // 探空格+经验
        p.addBuff(new BuffDeathGod()); // 死神
        switch(p.occupation){
            case "Nurse":{
                p.addBuff(new BuffNurse()); // 职业buff
                break;
            }
        }
        return p;
    }
}
