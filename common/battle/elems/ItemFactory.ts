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
            e.canUse = () => false;
            e.canBeMoved = false;
            return e;
        },

        // 金币堆
        "Coins": (bt, attrs) => {
            var e = new Item(bt);
            e.cnt = attrs.cnt;
            e.canUse = () => true;
            e.use = async () => await e.bt().implAddMoney(e, e.cnt);
            e.canBeMoved = true;
            return e;
        },

        // 钥匙
        "Key": (bt, attrs) => {
            var e = new Item(bt);
            e.canBeMoved = true;
            e.canUseAt = (x:number, y:number) => {
                var map = e.bt().level.map;
                var tog:Grid = map.getGridAt(x, y);
                var toe:Elem = map.getElemAt(x, y);
                return !tog.isCovered() && toe && Utils.indexOf(e.attrs.validTargets, (t) => t == toe.type) >= 0;
            }

            e.useAt = async (x:number, y:number) => {
                var map = e.bt().level.map;
                var toe:Elem = map.getElemAt(x, y);
                await toe.use(); // 调用开锁对象的 use 方法
            }

            return e;
        },

        // 门
        "Door": (bt, attrs) => {
            var e = new Item(bt);
            e.canBeMoved = false;
            e.use = async () => { // 门被设定为不可以使用，但有一个 use 方法，其实是给 Key 调用的
                var bt = e.bt();
                await bt.implRemoveElem(e);
                var pt = ElemFactory.create("NextLevelPort", bt);
                await bt.implAddElemAt(pt, e.pos.x, e.pos.y);
            }

            return e;
        },

        // 宝箱
        "TreasureBox": (bt, attrs) => {
            var e = new Item(bt);
            e.canBeMoved = true;
            e.use = async () => { // 宝箱被设定为不可以使用，但有一个 use 方法，其实是给 Key 调用的
                var bt = e.bt();
                await bt.implRemoveElem(e);
                var pt = ElemFactory.create("Key", bt);
                await bt.implAddElemAt(pt, e.pos.x, e.pos.y);
            }

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