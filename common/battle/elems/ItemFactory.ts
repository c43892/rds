class Item extends Elem {
    constructor(bt) {
        super(bt);
    }
}

// 普通物品
class ItemFactory {
    // 各元素逻辑
    public creators = {

        // 逃跑出口
        "EscapePort": (bt, attrs) => {
            var e = new Item(bt);
            e.canUse = () => true;
            return e;
        },

        // 金币堆
        "Coins": (bt, attrs) => {
            var e = new Item(bt);
            e.cnt = attrs.cnt;
            e.canUse = () => true;
            e.use = async () => {
                await e.bt().implAddMoney(e, e.cnt);
            }
            e.canBeMoved = true;
            return e;
        },

        // 下一关入口
        "NextLevelPort": (bt, attrs) => {
            var e = new Item(bt);
            e.canUse = () => true;
            e.use = async () => await e.bt().implGo2NextLevel(); // 进入下一关卡
            return e;
        }
    };
}