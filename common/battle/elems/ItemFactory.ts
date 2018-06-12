// 普通物品
class ItemFactory {
    // 各元素逻辑
    public creators = {

        // 逃跑出口
        "EscapePort": (bt, ps) => {
            var e = new Elem(bt);
            e.canUse = () => true;
            return e;
        },

        // 红药水
        "HpPotion": (bt, ps) => {
            var e = new Elem(bt);
            e.canUse = () => true;
            e.use = async () => await e.bt.implAddPlayerHp(10); // +10 hp
            e.canBeMoved = true;
            return e;
        },

        // 下一关入口
        "NextLevelPort": (bt, ps) => {
            var e = new Elem(bt);
            e.canUse = () => false;
            return e;
        }
    };
}