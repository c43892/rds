// 普通物品
class ItemFactory {
    // 各元素逻辑
    public creators = {

        // 逃跑出口
        "EscapePort": (bt) => {
            var e = new Elem(bt);
            e.canUse = () => true;
            return e;
        },

        // 红药水
        "HpPotion": (bt) => {
            var e = new Elem(bt);
            e.canUse = () => true;
            e.use = async () => {
                var ps = e.bt.getCalcPs("forHpPotion");
                var dhp = e.bt.bc.doCalc(10, ps);
                await e.bt.implAddPlayerHp(dhp);
            }
            e.canBeMoved = true;
            return e;
        },

        // 下一关入口
        "NextLevelPort": (bt) => {
            var e = new Elem(bt);
            e.canUse = () => true;
            e.use = async () => await e.bt.implGo2NextLevel(); // 进入下一关卡
            return e;
        }
    };
}