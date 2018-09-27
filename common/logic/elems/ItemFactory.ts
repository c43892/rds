class Item extends Elem {}

// 普通物品
class ItemFactory {
    createItem():Item {
        var item = new Item();
        item.canBeDragDrop = true;
        return item;
    }

    // 各元素逻辑
    public creators = {
        // 逃跑出口
        "EscapePort": (attrs) => {
            var e = this.createItem();
            e.canUse = () => false;
            e.canBeDragDrop = false;
            return e;
        },

        // 金币堆
        "Coins": (attrs) => {
            var e = this.createItem();
            e.cnt = attrs.cnt;
            e.canUse = () => true;
            e.use = async () => await e.bt().implAddMoney(e.cnt, e);
            e.getElemImgRes = () => e.cnt >= 9 ? e.type + "9" : e.type + e.cnt;
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
                await toe["useWithKey"](e); // 调用开锁对象的 use 方法
            }

            return e;
        },

        // 门
        "Door": (attrs) => {
            var e = this.createItem();
            e.canBeDragDrop = false;
            e.cnt = attrs.cnt;
            var locked = () => e.bt().level.map.findAllElems((e:Elem) => e["lockDoor"]).length > 0;
            var noKey = () => !e.bt().level.map.findFirstElem((elem:Elem) => elem.type == "Key" && !elem.getGrid().isCovered() && elem.isValid());
            e.canUse = () => !noKey() && !locked();
            e.canNotUseReason = () => e.canUse() ? undefined : (noKey() ? "noKey" : "doorLocked");
            e.getElemImgRes = () => e.type + e.cnt;
            e.use = async () => {
                var key = e.bt().level.map.findFirstElem((elem:Elem) => elem.type == "Key" && !elem.getGrid().isCovered() && elem.isValid());
                Utils.assert(!!key, "no key for door");
                await e.bt().impl2UseElemAt(key, e.pos.x, e.pos.y);
                return true;
            };
            e["useWithKey"] = async (key) => {
                e.cnt--;
                if (e.cnt <= 0)
                    await e.bt().implOnElemDie(e);
            };
            return e;
        },

        // 宝箱，设定为不可以使用，但有一个 use 方法，其实是给 Key 调用的
        "TreasureBox": (attrs) => {
            var e = this.createItem();
            e.canBeDragDrop = false;
            e.canUse = () => !!e.bt().level.map.findFirstElem((elem:Elem) => elem.type == "Key" && !elem.getGrid().isCovered() && elem.isValid());
            e.canNotUseReason = () => e.canUse() ? undefined : "noKey";
            e.use = async () => {
                var key = e.bt().level.map.findFirstElem((elem:Elem) => elem.type == "Key" && !elem.getGrid().isCovered() && elem.isValid());
                Utils.assert(!!key, "no key for door");
                await e.bt().impl2UseElemAt(key, e.pos.x, e.pos.y);
                return true;
            };
            e["useWithKey"] = async (key) => {
                await e.bt().implOnElemDie(e);
            };
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
                await bt.implAddDeathGodStep(15, e);
            }

            return e;
        },

        // 黑洞
        "Hole": (attrs) => {
            var e = this.createItem();
            e.barrier = true;
            e.canBeDragDrop = false;
            return e;
        },

        // 经验书
        "Magazine": (attrs) => ElemFactory.elemCanUseManyTimes(attrs.cnt, async (e:Elem) => await e.bt().implAddPlayerExp(attrs.dexp, e.pos), () => true, () => undefined, (e) => e.type)(this.createItem()),

        // 金融杂志
        "EconomyMagazine": (attrs) => ElemFactory.elemCanUseManyTimes(attrs.cnt, async (e:Elem) => {
            await e.bt().implAddPlayerExp(attrs.dexp, e.pos);
            var tc = e.bt().level.createElem("CoinsSmall");
            await e.bt().implAddMoney(tc.cnt, e);
        }, () => true, () => undefined, (e) => e.type)(this.createItem()),

        // 苹果
        "Apple": (attrs) => ElemFactory.foodLogic(attrs.cnt, attrs.dhp)(this.createItem()),

        // 牛排
        "Steak": (attrs) => ElemFactory.foodLogic(attrs.cnt, attrs.dhp)(this.createItem()),

        // 石块
        "Rock": (attrs) => ElemFactory.elemCanUseManyTimes(attrs.cnt, undefined, () => true, () => undefined, undefined)(this.createItem()),

        // 盾牌
        "Shield": (attrs) => {
            var e = this.createItem();
            e = ElemFactory.addAI("onCalcAttackResult", async (ps) => {
                var fs = ps.attackerAttrs.attackFlags;
                if (Utils.indexOf(fs, (s:string) => s == "AmorPenetrate") > -1) return;

                var priorCD = e.cd;
                e.resetCD();
                ps.r.r = "blocked";
                ps.r.dhp = ps.r.dshield = 0;
                await e.bt().fireEvent("onColddownChanged", {e:e, priorCD:priorCD});
            }, e, (ps) => {
                return e.isValid() && ps.r.r == "attacked" && ps.subType == "monster2targets" && ps.targetAttrs.owner instanceof Player});
            e = ElemFactory.triggerColddownLogic(e);
            e.getElemImgRes = () => (e.cd <= 0) ? e.type : e.type + "Back";
            return e;
        },

        // 小刀
        "Knife": (attrs) => {
            var e = this.createItem();
            e.resetCD = () => {}; // 共用武器逻辑带来的影响
            return ElemFactory.weaponLogic(1, true)(e);
        },

        // 小石块
        "SmallRock": (attrs) => {
            var e = this.createItem();
            e.resetCD = () => {}; // 共用武器逻辑带来的影响
            return ElemFactory.weaponLogic(1, true)(e);
        },

        // 冰块
        "IceBlock": (attrs) => ElemFactory.elemCanUseManyTimes(attrs.cnt, undefined, () => true, () => undefined, undefined)(this.createItem()),

        // 警棍
        "Baton": (attrs) => {
            var e = this.createItem();
            e = ElemFactory.addAI("onCalcAttacking", (ps) => {
                var attackerAttrs = ps.attackerAttrs;
                if (!(attackerAttrs.owner instanceof Player)) return;
                attackerAttrs.power.b += e.attrs.powerA;
            }, e, () => e.isValid(), true, true);
            return e;
        },

        // 防护衣
        "Vest": (attrs) => {
            var e = this.createItem();
            e = ElemFactory.addAI("onCalcAttacking", (ps) => {
                var fs = ps.attackerAttrs.attackFlags;
                if (Utils.indexOf(fs, (s:string) => s == "AmorPenetrate") > -1) return;

                var attackerAttrs = ps.attackerAttrs;                
                attackerAttrs.power.b += e.attrs.powerD;
                attackerAttrs.power.b = attackerAttrs.power.b < 1 ? 1 : attackerAttrs.power.b;
            }, e, (ps) => e.isValid() && ps.attackerAttrs.owner instanceof Monster && ps.attackerAttrs.owner.isHazard(), true, true);
            return e;
        },

        // 骷髅头
        "HeadBone": (attrs) => {
            var e = this.createItem();
            e = ElemFactory.addAI("onSneaked", async () => {
                var grid = e.getGrid();
                var bt = e.bt();
                var actBeforeRevive = async () => await bt.implRemoveElemAt(grid.pos.x, grid.pos.y)
                await bt.implReviveElemAt("SkeletonKing", undefined, grid.pos.x, grid.pos.y, actBeforeRevive);
            }, e);
            return e;
        },

        //茧
        "Cocoon": (attrs) => {
            var e = this.createItem();
            e.canBeDragDrop = false;
            e.canUse = () => {
                if(e["swathedBy"].isDead())
                    return true;
                else return false;
            };
            e.use = async () => {
                await e.bt().implOnElemDie(e);
            };
            return e;
        },

        // 通缉令
        "WantedOrder": (attrs) => {
            var e = this.createItem();
            e.canUse = () => true;
            e.use = async () => {
                var ms = BattleUtils.findRandomElems(e.bt(), 1, (e:Elem)=> e instanceof Monster && e.isHazard() && !e.isBoss && !e["isWanted"]);
                if(ms.length == 0) return;

                var m = ms[0];
                m["isWanted"] = true;
                await e.bt().fireEvent("onMakeWanted", {e:e, fromPos:e.pos, toPos:m.pos});
                var dropCoins = m.dropItems[Utils.indexOf(m.dropItems, (e:Elem) => e.type == "Coins")];
                if(dropCoins)
                    m.addDropItem(ElemFactory.create("Coins", {cnt:dropCoins.cnt * 9}));
            }
            return e;
        },

        // 下一关入口
        "NextLevelPort": (attrs) => {
            var e = this.createItem();
            e.canUse = () => true;
            e.use = async () => {
                await e.bt().implGo2NextLevel(); // 离开当前战斗
                e.bt().ended = true;
                return true;
            };
            return e;
        },

        
        // 披风，免疫一次偷袭
        "Cloak": (attrs) => {
            var e = this.createItem();
            e.canUse = () => false;
            e = ElemFactory.addAI("onSneaking", async (ps) => {
                    if (ps.immunized) return;
                    ps.immunized = true;
                    await e.bt().fireEvent("onCloakImmunizeSneak", {e:e});
                    await e.bt().implRemoveElemAt(e.pos.x, e.pos.y);
                }, e, () => e.isValid());
                return e;
        },

        // 生命之泉
        "LifeSpring": (attrs) => {
            var e = this.createItem();
            e.canUse = () => e.isValid();
            e.canBeDragDrop = false;
            e.use = async () => {
                var dhp = Math.ceil(e.bt().player.hp * e.attrs.percent / 100);
                await e.bt().implAddPlayerHp(dhp, e);
                }
            return e;
        }
    };
}