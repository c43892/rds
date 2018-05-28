
// 创建各种元素对象

class ElemFactory {

    static StaticInit() {
        Elem.getPlayer = () => Battle.CurrentBattle.player;
    }

    static InitElem(e:Elem, map:Map) {
        e.getBrick = () => map.getBrickAt(e.pos.x, e.pos.y);
    }

    // 创建指定类型元素
    public static create(type:string, map:Map, elemCfg) {
        var e = ElemFactory.creators[type](elemCfg[type]);
        e.type = type;
        ElemFactory.InitElem(e, map);
        return e;
    }

    // 各元素逻辑
    public static creators = {

        // 逃跑出口
        "EscapePort": (ps) => {
            var e = new Elem();
            e.canUse = () => true;
            e.use = Elem.escape;
            return e;
        },

        // 红药水
        "HpPotion": (ps) => {
            var e = new Elem();
            e.canUse = () => true;
            e.use = () => Elem.addPlayerHp(10); // +10 hp
            return e;
        },

        // 下一关入口
        "NextLevelPort": (ps) => {
            var e = new Elem();
            e.canUse = () => true;
            e.use = Elem.Go2NextLevel;
            return e;
        }
    };
}