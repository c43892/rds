// 将 player 设置为某职业
class Occupation {

    public static makeOccupation(p:Player):Player {
        var c = Occupation.creators[p.occupation];
        Utils.assert(c, "no such occupation: " + p.occupation);
        p.clear();
        
        p.buffs.push(new BuffBasic(p)); // 探空格+经验
        p.buffs.push(new BuffDeathGod(p)); // 死神

        return c(p);
    }

    static creators = {
        "nurse": Occupation.createNurse
    }
    
    // 护士
    static createNurse(p:Player):Player {
        p.buffs.push(new BuffNurse(p));
        p["forHpPotion"] = {a:0, b:0, c:1}; // 使用血瓶时加成
        return p;
    }
}
