// 普通物品
class ItemFactory {
    // 各元素逻辑
    public creators = {

        // 逃跑出口
        "EscapePort": (bt, attrs) => {
            var e = new Elem(bt);
            e.canUse = () => true;
            return e;
        },

        // 红药水
        "HpPotion": (bt, attrs) => {
            var e = new Elem(bt);
            e.canUse = () => true;
            e.use = async () => {
                // 搜集所有参数，过公式算一下最终值
                var ps = e.bt.getCalcPs("forHpPotion");
                var dhp = e.bt.bc.doCalc(attrs.dhp, ps);
                await e.bt.implAddPlayerHp(dhp);
            }
            e.canBeMoved = true;
            return e;
        },

        // 金币
        "Coins": (bt, attrs) => {
            var e = new Elem(bt);
            e.canUse = () => true;
            e.use = async () => {
                await e.bt.implAddMoney(e, attrs.cnt);
            }
            return e;
        },

        // 下一关入口
        "NextLevelPort": (bt, attrs) => {
            var e = new Elem(bt);
            e.canUse = () => true;
            e.use = async () => await e.bt.implGo2NextLevel(); // 进入下一关卡
            return e;
        }
    };
}