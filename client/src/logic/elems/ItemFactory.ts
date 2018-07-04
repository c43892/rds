class Item extends Elem {}

// 普通物品
class ItemFactory {
    createItem():Item {
        var item = new Item();
        item.canBeMoved = true;
        return item;
    }

    // 各元素逻辑
    public creators = {
        // 逃跑出口
        "EscapePort": (attrs) => {
            var e = this.createItem();
            e.canUse = () => false;
            e.canBeMoved = false;
            return e;
        },

        // 金币堆
        "Coins": (attrs) => {
            var e = this.createItem();
            e.cnt = attrs.cnt;
            e.canUse = () => true;
            e.use = async () => await e.bt().implAddMoney(e, e.cnt);
            return e;
        },

        // 钥匙
        "Key": (attrs) => {
            var e = this.createItem();
            e.canUseAt = (x:number, y:number) => {
                var map = e.bt().level.map;
                var tog:Grid = map.getGridAt(x, y);
                var toe:Elem = map.getElemAt(x, y);
                return !tog.isCovered() && toe && toe.isValid() && Utils.contains(e.attrs.validTargets, toe.type);
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
            var e = this.createItem();
            e.canBeMoved = false;
            e.use = async () => { // 门被设定为不可以使用，但有一个 use 方法，其实是给 Key 调用的
                var bt = e.bt();
                await bt.implRemoveElemAt(e.pos.x, e.pos.y);
                var pt = bt.level.createElem("NextLevelPort");
                await bt.implAddElemAt(pt, e.pos.x, e.pos.y);
            }

            return e;
        },

        // 宝箱，设定为不可以使用，但有一个 use 方法，其实是给 Key 调用的
        "TreasureBox": (attrs) => {
            var e = this.createItem();
            e.use = async () => {
                await e.bt().implOnElemDie(e);
                return true;
            }
            return e;
        },

        // 宝蛋
        "RandomEgg": (attrs) => {
            var e = this.createItem();
            e.canUse = () => true;
            e.use = async () => { 
                await e.bt().implOnElemDie(e);
                return true;
            };
            return e;
        },

        // 钟表
        "Clock": (attrs) => {
            var e = this.createItem();
            e.canUse = () => true;
            e.use = async () => {
                var bt = e.bt();
                await bt.implAddPlayerAttr("deathStep", 15);
            }

            return e;
        },

        // 医疗药剂
        "HpCapsule": (attrs) => {
            var e = this.createItem();
            e.canUse = () => true;
            e.use = async () => {
                var bt = e.bt();
                await bt.implAddBuff(bt.player, "BuffAddHp", e.attrs.cnt, e.attrs.heal);
            };

            return e;
        },

        // 解毒药剂
        "DePoison": (attrs) => {
            var e = this.createItem();
            e.canUse = () => true;
            e.use = async () => {
                var bt = e.bt();
                await bt.implRemoveBuff(bt.player, "BuffPoison");
            };

            return e;
        },

        // 黑洞
        "Hole": (attrs) => {
            var e = this.createItem();
            e.canBeMoved = false;
            return e;
        },

        // 经验书
        "Magazine": (attrs) => ElemFactory.elemCanUseManyTimes(attrs.cnt, async (e:Elem) => await e.bt().implAddPlayerExp(attrs.dexp), true)(this.createItem()),
       
        // 苹果
        "Apple": (attrs) => ElemFactory.foodLogic(attrs.cnt, attrs.dhp)(this.createItem()),

        // 牛排
        "Steak": (attrs) => ElemFactory.foodLogic(attrs.cnt, attrs.dhp)(this.createItem()),

        // 冰冻块
        "IceBlock": (attrs) => ElemFactory.elemCanUseManyTimes(attrs.cnt, undefined, true)(this.createItem()),

        // 盾牌
        "Shield": (attrs) => {
            var e = this.createItem();
            e.canBeMoved = true;
            e = ElemFactory.triggerColdownLogic()(e);
            e["onAttackResult"] = async (ps) => {
                if (ps.r.r != "attacked" || !e.canTrigger() || ps.subType != "monster2player") return;
                e.resetTrigger();
                ps.r.r = "blocked";
                ps.r.dhp = ps.r.dshield = 0;
                await e.bt().implNotifyElemChanged("coldown", e);
            };
            e.getElemImgRes = () => (e.cd <= 0) ? e.type + "1" : e.type + "2";
            return e;
        },

        // 剑
        "Sword": (attrs) => {
            var e = this.createItem();
            e.canBeMoved = true;
            e["onAttacking"] = async (ps) => {
                if (e.getGrid().isCovered() || !e.isValid()) return; // 检查可用性
                var attackerAttrs = ps.attackerAttrs;
                if (!(attackerAttrs.owner instanceof Player)) return;
                attackerAttrs.power.b += e.attrs.powerA;
                Utils.log(attackerAttrs.power.a, attackerAttrs.power.b, attackerAttrs.power.c);
            };
            return e;
        },

        // 下一关入口
        "NextLevelPort": (attrs) => {
            var e = this.createItem();
            e.canUse = () => true;
            e.canBeMoved = false;
            e.use = async () => await e.bt().implGo2NextLevel(); // 进入下一关卡
            return e;
        }
    };
}