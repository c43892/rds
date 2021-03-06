// 将 player 设置为某职业
class Occupation {
    public static makeOccupation(p:Player):Player {
        var c = Occupation.creators[p.occupation];
        Utils.assert(c, "no such occupation: " + p.occupation);

        p = c(p);
        p = Occupation.makeOccupationBuff(p);
        p = OccupationEffectMgr.effectOnCreatePlayer(p);
        return p;
    }

    static creators = {
        "Nurse": Occupation.makeNurse,
        "Rogue": Occupation.makeRogue,
    }

    // 获取各职业初始物品配置
    public static getInitialItems(occ:string) {
        return {
            "Nurse": {"relic": "MedicineBox", "prop":"SuperPotion", "prop4All": "HpPotion"},
            "Rogue": {"relic": "GangMember", "prop":"StrengthPotion", "prop4All": "StrengthPotion"}
        }[occ];
    }
    
    // 护士
    static makeNurse(p:Player):Player {
        p.addRelic(<Relic>ElemFactory.create("MedicineBox")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("TimeMachine")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("Endurance")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("Power")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("Agile")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("Fierce")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("Unback2Sneak")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("Crucifix")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("WeaponMaster")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("ExpMedal")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("GoldMedal")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("DefenseProficient")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("BookMaster")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("TradeMaster")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("TreasureBoxDetector")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("KnifeMaster")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("MonsterHunter")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("KnifeProficient")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("ExploreEnhanced")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("HorticultureProficient")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("SmellEnhanced")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("Storer")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("ShieldProficient")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("HorticultureMaster")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("StrikeFirst")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("ShieldBlock")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("ShieldDetector")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("ShieldSlam")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("VestDetector")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("VestImmune")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("VestThorns")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("Watchmaker")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("KnifeDetector")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("PoisonKnife")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("PoisonKnife")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("PoisonKnife")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("KnifeRange")); // 初始遗物
        // p.addRelic(<Relic>ElemFactory.create("InfinityKnife")); // 初始遗物
        p.addItem(<Prop>ElemFactory.create("SuperPotion"));
        return p;
    }

    // 流氓
    static makeRogue(p:Player):Player {
        p.addRelic(<Relic>ElemFactory.create("GangMember")); // 初始遗物
        p.addItem(<Prop>ElemFactory.create("StrengthPotion")); // 初始物品
        return p;
    }

    static occupationMakers = {
        "Nurse": (p:Player) => {
            p.addBuff(new BuffNurse()); // 职业buff
        },

        "Rogue": (p:Player) => {
        },
    };

    static exists(occupation) {
        return !!Occupation.occupationMakers[occupation];
    }

    // 根据解锁的职业获取全职业通用效果
    static getEffet4All(p){
        var unlockedOccupation = Utils.loadLocalData("unlockedOccupation");
        // 暂时没有解锁逻辑,默认为都解锁了
        if (!unlockedOccupation)
            unlockedOccupation = ["Nurse", "Rouge"];

        for (var occ of unlockedOccupation){
            p = Occupation.effect4All[occ](p);
        }
        return p;
    }

    // 职业效果
    static effect4All = {
        // 初始物品增加医疗药剂
        "Nurse": (p: Player) => {
            p.addItem(<Prop>ElemFactory.create("HpPotion"));
            return p;
        },

        // 初始遗物增加杀戮专精
        "Rouge": (p: Player) => {
            p.addRelic(<Relic>ElemFactory.create("Fierce"));
            return p;
        }
    }

    // 设置职业 buff
    static makeOccupationBuff(p:Player){
        p.clear();
        p.addBuff(new BuffBasic()); // 探空格+经验
        p.addBuff(new BuffDeathGod()); // 死神
        Occupation.occupationMakers[p.occupation](p);
        return p;
    }
}
