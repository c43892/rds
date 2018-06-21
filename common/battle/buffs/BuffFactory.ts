// 创建各种 buff
class BuffFactory {

    // 创建指定类型 buff
    public static create(type:string, ...ps:any[]):Buff {
        var buff;
        switch (type) {
            case "BuffBasic": buff = new BuffBasic(); break;
            case "BuffDeathGod": buff = new BuffDeathGod(); break;
            case "BuffFlame": buff = new BuffFlame(ps[0]); break;
            case "BuffPoison": buff = new BuffPoison(ps[0]); break;
            case "BuffNurse": buff = new BuffNurse(); break;
            case "BuffAddHp": buff = new BuffAddHp(ps[0]); break;
        }

        Utils.assert(!!buff, "no such a buff: " + type);
        return buff;
    }
}