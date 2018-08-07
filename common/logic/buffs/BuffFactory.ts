// 创建各种 buff
class BuffFactory {

    // 创建指定类型 buff
    public static create(type:string, ...ps:any[]):Buff {
        var buff;
        switch (type) {
            case "BuffBasic": buff = new BuffBasic(); break;
            case "BuffDeathGod": buff = new BuffDeathGod(); break;
            case "BuffFlame": buff = new BuffFlame(ps[0], ps[1]); break;
            case "BuffPoison": buff = new BuffPoison(ps[0], ps[1]); break;
            case "BuffNurse": buff = new BuffNurse(); break;
            case "BuffAddHp": buff = new BuffAddHp(ps[0], ps[1]); break;
            case "BuffPoisonOnGrids": buff = new BuffPoisonOnGrids(ps[0], ps[1], ps[2]); break;
            case "BuffSuperPotion": buff = new BuffSuperPotion(ps[0]); break;
            case "BuffStrangthPotion": buff = new BuffStrangthPotion(ps[0]); break;
        }

        Utils.assert(!!buff, "no such a buff: " + type);
        return buff;
    }
}