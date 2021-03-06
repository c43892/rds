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
                return !tog.isCovered() && toe && toe.isValid() && toe.canUse() && Utils.contains(e.attrs.validTargets, toe.type);
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
                return {reserve: true, asPlayerActed: false};
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
                return {reserve: true, asPlayerActed: false};
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
            e.use = async () => {};
            return e;
        },

        // boss三选一宝箱
        "LuxuryChest": (attrs) => {
            var e = this.createItem();
            e.canUse = () => true;
            e.use = async () => {
                var b = await e.bt().implOpenLuxuryChest(e);
                return b;
            };
            return e;
        },

        // 钟表
        "Clock": (attrs) => {
            var e = this.createItem();
            e.canUse = () => true;
            e.use = async () => {
                var bt = e.bt();
                var ps = {e:e, deathStepBack:e.attrs.deathStepBack};
                e.bt().triggerLogicPointSync("onUseClock", ps);
                await bt.implAddDeathGodStep(ps.deathStepBack, e);
            }

            return e;
        },

        // 大本钟
        "BigBen": (attrs) => {
            var e = this.createItem();
            e.canUse = () => true;
            e.use = async () => {
                var bt = e.bt();
                await bt.implAddDeathGodStep(e.attrs.deathStepBack, e);
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
        "Rock": (attrs) => {
            var e = ElemFactory.elemCanUseManyTimes(attrs.cnt, undefined, () => true, () => undefined, undefined)(this.createItem());
            e.canBeDragDrop = false;
            e.barrier = true;
            return e;
        },

        // 盾牌
        "Shield": (attrs) => {
            var e = this.createItem();
            e.canUse = () => false;
            e.canNotUseReason = () => {
                if (Utils.indexOf(e.bt().player.relicsEquipped, (r: Relic) => r.type == "ShieldSlam") > -1)
                    return "inCD";
                else
                    return "shieldPassiveTriggerDesc";
            };
            e.useAt = async (x: number, y: number) => {
                // 需要cd结束可用
                if (!e.isValid()) return e["shield"] > 0;

                var results = [];
                Utils.assert(e.bt().level.map.getElemAt(x, y) instanceof Monster, "shield can only attack a monster");
                var monster = <Monster>e.bt().level.map.getElemAt(x, y);
                var hp = monster.hp;
                var shield = monster.shield;
                await e.bt().implPlayerAttackAt(x, y, e, results);                

                // 根据伤害值来变更剩余护盾值,为0则消耗盾牌
                var result = results[0];
                var damage;
                if (result.dhp < 0)
                    damage = Math.min(hp, Math.abs(result.dhp));
                else
                    damage = Math.min(shield, Math.abs(result.dShield));

                e["shield"] -= damage;
                // 需要处理之前在"onUseElemAt"中隐藏显示的格子,如果没被消耗还需要飞回来
                // await e.bt().fireEvent("onShieldFlyBack", {e:e, from:monster, back:e["shield"] > 0});
                if (e["shield"] > 0){                    
                    // 进入CD
                    var priorCD = e.cd;
                    e.resetCD();
                    await e.bt().fireEvent("onColddownChanged", { e: e, priorCD: priorCD });
                }
                return e["shield"] > 0;
            }

            e = ElemFactory.addAI("onCalcAttackResult", async (ps) => {
                var fs = ps.attackerAttrs.attackFlags;
                if (Utils.indexOf(fs, (s: string) => s == "AmorPenetrate") > -1) return;

                ps.r.r = "blocked";
                e["shield"] += ps.r.dhp;
                ps.r.dhp = ps.r.dshield = 0;
                if (e["shield"] > 0) {
                    var priorCD = e.cd;
                    e.resetCD();
                    await e.bt().fireEvent("onColddownChanged", { e: e, priorCD: priorCD });
                }
                else await e.bt().implOnElemDie(e);
            }, e, (ps) => {
                return e.isValid() && ps.r.r == "attacked" && ps.subType == "monster2targets" && ps.targetAttrs.owner instanceof Player
            });

            // 确定盾牌的攻击力
            e = ElemFactory.addAI("onCalcAttacking", (ps) => {
                ps.attackerAttrs.power.b = e["shield"]
            }, e, (ps) => ps.weapon == e, true, true);
            e = ElemFactory.triggerColddownLogic(e);
            e.getElemImgRes = () => (e.cd <= 0) ? e.type : e.type + "Back";
            e["shield"] = attrs.shield;
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
        "IceBlock": (attrs) => {
            var e = ElemFactory.elemCanUseManyTimes(attrs.cnt, undefined, () => true, () => undefined, undefined)(this.createItem());
            e.canBeDragDrop = false;
            return e;
        },

        // 警棍
        "Baton": (attrs) => {
            var e = this.createItem();
            e.canNotUseReason = () => "batonPassiveTriggerDesc";
            e = ElemFactory.addAI("onCalcAttacking", (ps) => {
                var attackerAttrs = ps.attackerAttrs;
                if (!(attackerAttrs.owner instanceof Player)) return;
                attackerAttrs.power.b += e.attrs.powerA;
            }, e, (ps) => e.isValid() && !ps.isMultAndNot1st, true, true);
            return e;
        },

        // 防护衣
        "Vest": (attrs) => {
            var e = this.createItem();
            e = ElemFactory.addAI("onCalcAttacking", (ps) => {
                var fs = ps.attackerAttrs.attackFlags;
                if (Utils.indexOf(fs, (s:string) => s == "AmorPenetrate") > -1) return;

                var attackerAttrs = ps.attackerAttrs;
                var calcElemAttrsPs = {e:e, dPower:0};
                e.bt().triggerLogicPointSync("onCalcElemAttrs", calcElemAttrsPs);
                attackerAttrs.power.b -= (e.attrs.dPower + calcElemAttrsPs.dPower);
                attackerAttrs.power.b = attackerAttrs.power.b < 1 ? 1 : attackerAttrs.power.b;
            }, e, (ps) => e.isValid() && ps.attackerAttrs.owner instanceof Monster && ps.attackerAttrs.owner.isHazard() && !ps.isMultAndNot1st, true, true);
            return e;
        },

        // 骷髅头
        "HeadBone": (attrs) => {
            var e = this.createItem();
            e.isValid = () => true;
            e = ElemFactory.addAI("onSneaked", async () => {
                var grid = e.getGrid();
                var bt = e.bt();
                var actBeforeRevive = async () => await bt.implRemoveElemAt(grid.pos.x, grid.pos.y)
                await bt.implReviveElemAt("SkeletonKing", undefined, grid.pos.x, grid.pos.y, actBeforeRevive);
            }, e);
            e.canNotUseReason = () => "headBoneUseDesc";
            return e;
        },

        //茧
        "Cocoon": (attrs) => {
            var e = this.createItem();
            e.canBeDragDrop = false;
            e.canUse = () => !e["swathedBy"].isInMap();
            e.canNotUseReason = () => e.canUse() ? undefined : "swathed";
            e.use = () => {};
            return e;
        },

        // 通缉令
        "WantedOrder": (attrs) => {
            var e = this.createItem();
            e.canUse = () => true;
            e.use = async () => {
                var ms = BattleUtils.findRandomElems(e.bt(), 1, (e:Elem) => e instanceof Monster && e.isHazard() && !e.isBoss && !e.isElite && !e["isWanted"]
                    && Utils.indexOf(e.dropItems, (d:Elem) => d.type == "Coins") > -1);
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
            e.canBeDragDrop = false;
            e.canUse = () => true;
            e.use = async () => {
                await e.bt().implGo2NextLevel(); // 离开当前战斗
                e.bt().finished = !e.bt().player.isDead(); // 最后一次死掉的机会
                return {reserve: true, asPlayerActed: false};
            };
            return e;
        },

        
        // 披风，免疫一次偷袭
        "Cloak": (attrs) => {
            var e = this.createItem();
            e.canUse = () => false;
            e.canNotUseReason = () => "cloakPassiveTriggerDesc"
            e = ElemFactory.addAI("onSneaking", async (ps) => {
                    if (ps.immunized) return;
                    ps.immunized = true;
                    await e.bt().fireEvent("onCloakImmunizeSneak", {e:e, m:ps.m});
                    await e.bt().implRemoveElemAt(e.pos.x, e.pos.y);
                }, e, () => e.isValid());
                return e;
        },

        // 生命之泉
        "DeluxeMeal": (attrs) => {
            var e = this.createItem();
            e.canUse = () => e.isValid();
            e.canBeDragDrop = false;
            e.use = async () => {
                var dhp = Math.ceil(e.bt().player.maxHp * e.attrs.percent / 100);
                await e.bt().implAddPlayerHp(dhp, e);
            }
            return e;
        }, 

        // 开遗物装备格子
        "OpenRelicSpace":(attrs) => {
            var e = this.createItem();
            e["autoUseInBattle"] = async (bt:Battle) => {
                Utils.assert(bt.player.relicsEquippedCapacity < bt.player.relicEquippedCapacityMax, 
                    "open equipped relics position overflow");
                bt.player.relicsEquippedCapacity++;
                await bt.fireEvent("relicsEquippedMaxNumAdded");
            };

            return e;
        },

        // 点金手
        "GoldenHand":(attrs) => {
            var e = this.createItem();
            e.cnt = attrs.cnt;
            e.canUse = () => e.isValid();
            e.canUseAt = (x:number, y:number) => {
                var map = e.bt().level.map;
                var tog:Grid = map.getGridAt(x, y);
                var toe:Elem = map.getElemAt(x, y);
                return (!tog.isCovered() || tog.isMarked()) && toe && toe instanceof Monster && toe.isHazard() && !toe.isBoss && !toe.isElite && toe.type != "PlaceHolder";
            };
            // 消灭怪物并将其掉落金钱改为固定值
            e.useAt = async (x: number, y: number) => {
                e.cnt--;
                var bt = e.bt();
                var m = <Monster>bt.level.map.getElemAt(x, y);
                var index = Utils.indexOf(m.dropItems, (c:Elem) => c.type == "Coins");
                if(index > -1){
                    var coins = m.dropItems[index];
                    coins.cnt = e.attrs.dropNum;
                } else {
                    var coins = ElemFactory.create("Coins", {cnt:e.attrs.dropNum});
                    m.addDropItem(coins);
                }
                await bt.implDestoryAt(x, y, e);
                return e.cnt > 0;
            }
            return e;
        }
    };
}