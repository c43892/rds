class Item extends Elem {}

// 普通物品
class ItemFactory {
    // 各元素逻辑
    public creators = {

        // 逃跑出口
        "EscapePort": (attrs) => {
            var e = new Item();
            e.canUse = () => false;
            e.canBeMoved = false;
            return e;
        },

        // 金币堆
        "Coins": (attrs) => {
            var e = new Item();
            e.cnt = attrs.cnt;
            e.canUse = () => true;
            e.use = async () => await e.bt().implAddMoney(e, e.cnt);
            e.canBeMoved = true;
            return e;
        },

        // 钥匙
        "Key": (attrs) => {
            var e = new Item();
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
        "Door": (attrs) => {
            var e = new Item();
            e.canBeMoved = false;
            e.use = async () => { // 门被设定为不可以使用，但有一个 use 方法，其实是给 Key 调用的
                var bt = e.bt();

                await bt.implRemoveElemAt(e.pos.x, e.pos.y);
                var pt = ElemFactory.create("NextLevelPort", bt);
                await bt.implAddElemAt(pt, e.pos.x, e.pos.y);
            }

            return e;
        },

        // 宝箱
        "TreasureBox": (attrs) => {
            var e = new Item();
            e.canBeMoved = true;
            e.use = async () => { // 宝箱被设定为不可以使用，但有一个 use 方法，其实是给 Key 调用的
                var bt = e.bt();

                await bt.implRemoveElemAt(e.pos.x, e.pos.y);

                var genElem = e.attrs.inBox[bt.srand.nextInt(0, e.attrs.inBox.length)];
                if (genElem) {

                    var ge = ElemFactory.create(genElem);
                    await bt.implAddElemAt(ge, e.pos.x, e.pos.y);
                }
            }

            return e;
        },

        // 宝蛋
        "RandomEgg": (attrs) => {
            var e = new Item();
            e.canBeMoved = true;
            e.canUse = () => true;
            e.use = async () => {
                var bt = e.bt();
				await bt.implRemoveElemAt(e.pos.x, e.pos.y);
                var genElem = e.attrs.inBox[bt.srand.nextInt(0, e.attrs.inBox.length)];
                if (genElem) {
                    var ge = ElemFactory.create(genElem);
                    await bt.implAddElemAt(ge, e.pos.x, e.pos.y);
                    
                }
                return true;
            }
            return e;
        },

        



        // 钟表
        "Clock": (attrs) => {
            var e = new Item();
            e.canBeMoved = true;
            e.canUse = () => true;
            e.use = async () => {
                var bt = e.bt();
                await bt.implAddPlayerAttr("deathStep", 15);
            }

            return e;
        },

        // 医疗药剂
        "HpCapsule": (attrs) => {
            var e = new Item();
            e.canBeMoved = true;
            e.canUse = () => true;
            e.use = async () => {
                var bt = e.bt();
                await bt.implAddBuff(bt.player, "BuffAddHp", e.attrs.cnt);
            };

            return e;
        },

        // 解毒药剂
        "DePoison": (attrs) => {
            var e = new Item();
            e.canBeMoved = true;
            e.canUse = () => true;
            e.use = async () => {
                var bt = e.bt();
                await bt.implRemoveBuff(bt.player, "BuffPoison");
            };

            return e;
        },
        
        // 经验书
        "Magazine": (attrs) => {
            var e = new Item();
            e.cnt = attrs.cnt;
            e.canBeMoved = true;
            e.canUse = () => true;
            e.use = async () => {
                e.cnt--;
                var bt = e.bt();
                await bt.implAddPlayerExp(1);
                return e.cnt > 0;
            };

            return e;
        },

        // 黑洞
        "Hole": (attrs) => {
            var e = new Item();
            e.canBeMoved = false;
            return e;
        },

        // 苹果3
        "Apple3": (attrs) => {
            var e = new Item();
            e.canBeMoved = true;
            e.canUse = () => true;
            e.use = async () => {
                var bt = e.bt();
                var apple2 = ElemFactory.create("Apple2");
                await bt.implReplaceElemAt(e, apple2);
                await bt.implAddPlayerHp(1);
                return true;
            };
            return e;
        },

        // 苹果2
        "Apple2": (attrs) => {
            var e = new Item();
            e.canBeMoved = true;
            e.canUse = () => true;
            e.use = async () => {
                var bt = e.bt();
                var apple1 = ElemFactory.create("Apple1");
                await bt.implReplaceElemAt(e, apple1);
                await bt.implAddPlayerHp(1);
                return true;
            };
            return e;
        },

        // 苹果1
        "Apple1": (attrs) => {
            var e = new Item();
            e.canBeMoved = true;
            e.canUse = () => true;
            e.use = async () => {
                var bt = e.bt();
                await bt.implAddPlayerHp(1);
            };
            return e;
        },

        // 牛排3
        "Steak3": (attrs) => {
            var e = new Item();
            e.canBeMoved = true;
            e.canUse = () => true;
            e.use = async () => {
                var bt = e.bt();
                var steak2 = ElemFactory.create("Steak2");
                await bt.implReplaceElemAt(e, steak2);
                await bt.implAddPlayerHp(2);
                return true;
            };
            return e;
        },

        // 牛排2
        "Steak2": (attrs) => {
            var e = new Item();
            e.canBeMoved = true;
            e.canUse = () => true;
            e.use = async () => {
                var bt = e.bt();
                var steak1 = ElemFactory.create("Steak1");
                await bt.implReplaceElemAt(e, steak1);
                await bt.implAddPlayerHp(2);
                return true;
            };
            return e;
        },

        // 牛排1
        "Steak1": (attrs) => {
            var e = new Item();
            e.canBeMoved = true;
            e.canUse = () => true;
            e.use = async () => {
                var bt = e.bt();
                await bt.implAddPlayerHp(2);
            };
            return e;
        },

        // 下一关入口
        "NextLevelPort": (attrs) => {
            var e = new Item();
            e.canUse = () => true;
            e.use = async () => await e.bt().implGo2NextLevel(); // 进入下一关卡
            return e;
        }
    };
}