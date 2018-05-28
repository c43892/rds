// 普通物品
class ItemFactory {
    // 各元素逻辑
    public creators = {

        // 逃跑出口
        "EscapePort": (ps) => {
            var e = new Elem();
            e.canUse = () => true;
            return e;
        },

        // 红药水
        "HpPotion": (ps) => {
            var e = new Elem();
            e.canUse = () => true;
            e.use = () => Battle.CurrentBattle.addPlayerHp(10); // +10 hp
            e.hazard = true;
            return e;
        },

        // 下一关入口
        "NextLevelPort": (ps) => {
            var e = new Elem();
            e.canUse = () => true;
            return e;
        }
    };
}