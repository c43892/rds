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
            e.cnt = attrs.cnt;
            e.canUse = () => true;
            e.use = async () => {
                await e.bt.implAddMoney(e, e.cnt);
            }
            e.canBeMoved = true;
            return e;
        },

        // 枪
        "Gun": (bt, attrs) => {
            var e = new Elem(bt);
            e.cnt = attrs.cnt;
            e["power"] = attrs.power;
            e.canUseAt = (x, y) => {
                var toe = e.bt.level.map.getElemAt(x, y);
                return toe instanceof Monster;
            };

            e.useAt = async (x, y) => {
                var m = <Monster>e.bt.level.map.getElemAt(x, y);
                await e.bt.implPlayerAttackMonster(m, e);
                e.cnt--;
                return e.cnt > 0;
            }

            e.canBeMoved = true;
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