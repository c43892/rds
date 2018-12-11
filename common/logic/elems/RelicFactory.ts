
// 遗物刚被创建时，是一个 item，其拾取操作，才生成一个遗物到玩家身上
class RelicFactory {

    // 创建一个遗物在地图上的包装对象
    createRelic(attrs, needResetOnReinforceLvUp:boolean, ...funcs):Relic {
        var e = new Relic();
        e.canUse = () => true;
        e.canBeDragDrop = true;
        var cd = 0;
        // 要么是 1 个功能，不可变异，要么是 6 个，可以提供变异逻辑
        Utils.assert(funcs.length == 1 || funcs.length == 6, "invalid relic functors number: " + funcs.length);
        e.funcs = funcs;
        e.toRelic = (p:Player) => {
            e.player = p;
            e.use = undefined;
            funcs[0](e, true);
            e.enabledFuncs = [0];
            return e;
        };
        e.use = async () => { 
            var bt = e.bt();
            var p = bt.player;
            await bt.implPickupRelic(e);
        };

        if (attrs.reinforceLv) // 初始强化等级
            e.setReinfoceLv(attrs.reinforceLv);
        
        if (attrs.reinforce && attrs.reinforce.length > 0) { // 设计遗留问题，需要额外保留一下初始属性值
            attrs.originalAttrsBeforeReinforce = {};
            for (var k in attrs.reinforce[0])
                attrs.originalAttrsBeforeReinforce[k] = attrs[k];
        }

        // 强化时需要重置效果
        if (needResetOnReinforceLvUp) {
            e.beforeReinforceLvUp = () => e.removeAllEffects();
            e.afterReinforceLvUp = () => {
                e.toRelic(e.player);
                e.redoAllMutatedEffects();
            };
        }
        
        return e;
    }

    public creators = {
        // 医疗箱过关回血
        "MedicineBox": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("beforeGoOutLevel2");
                    return;
                }
                ElemFactory.addAI("beforeGoOutLevel2", async () => r.bt().implAddPlayerHp(r.attrs.dhp, r), r)
            });
        },

        // 黑帮
        "GangMember": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("beforeOpenShopInBattle");
                    r.clearAIAtLogicPoint("beforeOpenShopOnWorldmap");
                    return;
                }
                
                // level 1&4
                ElemFactory.addAI("beforeOpenShopInBattle", (robChecker) => {
                    if (r.reinforceLv >= 3)
                        robChecker.robNum = r.player.playerRandom.next100() < 50 ? 2 : 1;
                    else
                        robChecker.robNum = 1;
                }, r, () => true, false, true);

                // level 2
                ElemFactory.addAI("beforeCreateWorldMapEventSelGroup", (robChecker) => {
                    robChecker.doExtraRobSel = r.reinforceLv >= 1;
                }, r, () => true, false, true);

                // level 3
                if (r.reinforceLv >= 2) {
                    ElemFactory.addAI("beforeOpenShopOnWorldmap", (robChecker) => {
                        robChecker.robNum = 1;
                    }, r, () => true, false, true);
                }

                // level 5
                if (r.reinforceLv >= 4) {
                    ElemFactory.addAI("onRobbedOnWorldmap", (extraRobChecker) => {
                        extraRobChecker.robExtraItem = r.player.playerRandom.next100() < 25;
                    }, r, () => true, false, true);
                }
            });
        },

        // 鹰眼，每关开始前标注一个带钥匙的怪物
        "Hawkeye": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onStartupRegionUncoveredMark");
                    return
                };
                ElemFactory.addAI("onStartupRegionUncoveredMark", async () => {
                    var ms = BattleUtils.findRandomElems(r.bt(), 1, (m) => {
                        if (!(m instanceof Monster)) return false;
                        if (!m.getGrid().isCovered() || m.getGrid().isMarked()) return false;
                        if (m.isBoss) return false;
                        return Utils.indexOf(m.dropItems, (dpi) => dpi.type == "Key") >= 0;
                    });

                    if (ms.length == 0) return;
                    var m = ms[0];
                    await r.bt().implMark(m.pos.x, m.pos.y);
                }, r);
            });
        }, 

        // 时光机
        "TimeMachine": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("beforeGoOutLevel2");
                    return
                };
                ElemFactory.addAI("beforeGoOutLevel2", async () => {
                    await r.bt().implAddDeathGodStep(attrs.deathGodBackStep, r);
                }, r);
            });
        },

        // 耐力
        "Endurance": (attrs) => {
            return this.createRelic(attrs, true, (r:Relic, enable:boolean) => {
                if (enable) {
                    r.player.addMaxHp(enable ? attrs.dMaxHp : -attrs.dMaxHp);
                    r.player.addHp(enable ? attrs.dMaxHp : -attrs.dMaxHp);
                } else {
                    r.player.addHp(enable ? attrs.dMaxHp : -attrs.dMaxHp);
                    r.player.addMaxHp(enable ? attrs.dMaxHp : -attrs.dMaxHp);
                }
            });
        },

        // 力量
        "Power": (attrs) => {
            return this.createRelic(attrs, true, (r:Relic, enable:boolean) => {
                r.player.power[0] += (enable ? attrs.dPower : -attrs.dPower);
            });
        },

        // 机敏
        "Agile": (attrs) => {
            return this.createRelic(attrs, true, (r:Relic, enable:boolean) => {
                r.player.addDodge(enable ? attrs.dDodge : -attrs.dDodge);
            });
        },

        // 凶暴
        "Fierce": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onCalcAttacking");
                    return
                };
                ElemFactory.addAI("onCalcAttacking", (ps) => {
                    ps.attackerAttrs.power.b += attrs.dPower; // 增加攻击
                }, r, (ps) => ps.subType == "player2monster" && Utils.contains(ps.targetAttrs.targetFlags, "Sneaked"), false, true);
            });
        },

        // 料敌先机，免疫突袭时的反击
        "Unback2Sneak": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onAttacked");
                    return;
                }
                ElemFactory.addAI("onAttacked", async (ps) => {
                    ps.attackerAttrs.attackFlags.push("immuneAttackBack");
                }, r, (ps) => {
                    return ps.subType == "player2monster" && Utils.contains(ps.targetAttrs.targetFlags, "Sneaked")});
            });
        },

        // 十字架,阻止怪物复活
        "Crucifix": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("beforeElemRevive");
                    return;
                }
                ElemFactory.addAI("beforeElemRevive", async (ps) => {
                    if(!ps.achieve)
                        return;
                    
                    await r.bt().fireEvent("onRelicEffect", {r:r});
                    ps.achieve = false;
                }, r)
            })
        },

        // 武器大师
        "WeaponMaster": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    return;
                }                
                r = RelicFactory.addElemsOnLevelInit(r);
            })
        },

        // 每翻开20个空格，角色获得一点护甲（每升一级降低2个空格，最高5）
        "UndefinedName1": (attrs) => {
            var thisRelic = this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onGridChanged");
                    return;
                }
                r["roundCnt"] = 0;                
                ElemFactory.addAI("onGridChanged", async () => {
                   var bt = r.bt();
                   r["roundCnt"] += 1;
                   if(r["roundCnt"] >= attrs.uncoverCnt){
                       r["roundCnt"] = 0;
                       await bt.implAddPlayerShield(1);
                   }
                }, r, (ps) => ps.subType == "gridUncovered");
            })
            thisRelic = <Relic>ElemFactory.addAI("beforeGoOutLevel2", () => thisRelic["roundCnt"] = 0, thisRelic);
            return thisRelic;
        },

        // 经验勋章 杀死怪物可以额外获得1点经验，每升一级提高1，最高5
        "ExpMedal": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onElemChanged");
                    return;
                }
                ElemFactory.addAI("onElemChanged", async () => {
                    await r.bt().fireEvent("onRelicEffect", {r:r});
                    await r.bt().implAddPlayerExp(attrs.dexp, r.pos);
                }, r, (ps) => ps.subType == "die" && ps.e instanceof Monster && ps.e.isHazard())
            })
        },

        // 金钱勋章 每个怪物掉落的金钱增加1，每升一级提高1，最高5
        "GoldMedal": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onElemChanged");
                    return;
                }
                ElemFactory.addAI("onElemChanged", async (ps) => {
                    var m = <Monster>ps.e;
                    if(Utils.indexOf(m.dropItems, (e:Elem) => e.type == "Coins") < 0) return;
                    
                    await r.bt().fireEvent("onRelicEffect", {r:r});
                    m.addDropItem(m.bt().level.createElem("Coins", {cnt:attrs.num}));
                }, r, (ps) => ps.subType == "preDie" && ps.e instanceof Monster)
            })
        },

        // 防护专精,每层额外增加一件防护服,防护服额外减少敌人1点攻击
        "DefenseProficient": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    r.clearAIAtLogicPoint("onCalcElemAttrs");
                    return;
                }                
                r = RelicFactory.addElemsOnLevelInit(r);
                r = <Relic>ElemFactory.addAI("onCalcElemAttrs", (ps) => {
                    ps.dPower += 1;
                }, r, (ps) => ps.e.type == "Vest", false, true);
            })
        },

        // 防护探索	每层额外增加一件防护服，你知道所有防护服的位置
        "VestDetector": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    r.clearAIAtLogicPoint("onStartupRegionUncoveredMark");
                    return;
                }
                r = RelicFactory.addElemsOnLevelInit(r);
                r = <Relic>ElemFactory.addAI("onStartupRegionUncoveredMark", async () => {
                    var vests = r.bt().level.map.findAllElems((e:Elem) => e.getGrid().isCovered() && !e.getGrid().isMarked() && e.type == "Vest");
                    for (var vest of vests){
                        await r.bt().fireEvent("onRelicEffect", {r:r});
                        await r.bt().implMark(vest.pos.x, vest.pos.y);
                    }
                }, r);
            })
        },

        // 防护免疫	每层额外增加一件防护服，每一件防护服可用的时候有1%的几率免疫伤害（每级+1%，最高5）
        "VestImmune": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    return;
                }
                r = RelicFactory.addElemsOnLevelInit(r);
                r = <Relic>ElemFactory.addAI("onCalcAttacking", (ps) => {
                    var vests = r.bt().level.map.findAllElems((e:Elem) => !e.getGrid().isCovered() && e.type == "Vest"  && e.isValid());
                    if (vests.length > 0){
                        var rand = r.bt().srand.nextInt(0, 100);
                        if (rand < r.attrs.percent * vests.length)
                            ps.targetAttrs.targetFlags.push("cancelAttack");
                    }
                }, r, (ps) => ps.targetAttrs.owner instanceof Player, false, true);
            })
        },

        // 防护反伤	每层额外增加一件防护服，你受到攻击时对怪物造成1点反伤（每级+1，最高5）
        "VestThorns": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    r.clearAIAtLogicPoint("onSingleAttacked");
                    return;
                }
                r = RelicFactory.addElemsOnLevelInit(r);
                r = <Relic>ElemFactory.addAI("onSingleAttacked", async (ps) => {
                    if (ps.r.r != "attacked" || ps.r.dhp >= 0) return;
                    await r.bt().fireEvent("onRelicEffect", {r:r});
                    await r.bt().implAddMonsterHp(ps.attackerAttrs.owner, - r.attrs.thornsDamage, "thorns");
                }, r, (ps) => ps.targetAttrs.owner instanceof Player);
            })
        },

        // 图书大师,每层额外增加一本书,读书增加1点经验
        "BookMaster": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    r.clearAIAtLogicPoint("onElemChanged");
                    return;
                }                
                r = RelicFactory.addElemsOnLevelInit(r);
                r = <Relic>ElemFactory.addAI("onElemChanged", async (ps) => {
                    if (!Utils.contains(ps.e.attrs.tags, "book")) return;
                    await r.bt().implAddPlayerExp(r.attrs.dexp, ps.e.pos);
                }, r, (ps) => ps.subType == "useElem");
            })
        },

        // 交易大师,你购买物品的价格优惠5%（每升一级5%，最高5级）
        "TradeMaster": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onOpenShop");
                    return;
                }
                ElemFactory.addAI("onOpenShop", (ps) => ps.discount += r.attrs.discount, r, undefined, false, true)
        })},

        // 宝箱探测,每进入一层新的战斗地图，都可以标记一个宝箱的位置
        "TreasureBoxDetector": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onStartupRegionUncoveredMark");
                    return;
                }
                ElemFactory.addAI("onStartupRegionUncoveredMark", async () => {
                    var tb = BattleUtils.findRandomElems(r.bt(), 1, (e:Elem) => e.getGrid().isCovered() && !e.getGrid().isMarked() && e.type == "TreasureBox")[0];
                    if(tb)
                        await r.bt().implMark(tb.pos.x, tb.pos.y);
                }, r)
            })
        },

        // 飞刀大师,每场战斗增加一把飞刀，飞刀造成的伤害+X（最高5级）
        "KnifeMaster": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    r.clearAIAtLogicPoint("onCalcAttacking");
                    return;
                }
                r = <Relic>ElemFactory.addAI("onCalcAttacking", (ps) => {
                    ps.attackerAttrs.power.b += attrs.dpower;
                }, r, (ps) => ps.subType == "player2monster" && ps.weapon && ps.weapon.type == "Knife", false, true);
                r = RelicFactory.addElemsOnLevelInit(r);
            })
        },

        // 飞刀专精	每场战斗增加一把飞刀，飞刀攻击时无视护甲
        "KnifeProficient": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onCalcAttacking");
                    r.clearAIAtLogicPoint("onLevelInited");
                    return;
                }
                r = <Relic>ElemFactory.addAI("onCalcAttacking", (ps) => {
                    ps.attackerAttrs.attackFlags.push("Pierce");
                }, r, (ps) => ps.subType == "player2monster" && ps.weapon && ps.weapon.type == "Knife", false, true)
                r = RelicFactory.addElemsOnLevelInit(r);
            })
        },

        // 飞刀流3	每场战斗增加一把飞刀，你的飞刀可以攻击任意格子（boss技能）
        "KnifeRange": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    r.clearAIAtLogicPoint("canUseAt");
                    return;
                }
                r = RelicFactory.addElemsOnLevelInit(r);
                r = <Relic>ElemFactory.addAI("canUseAt", (ps) => {
                    if (!ps.canUseAt){
                        var g:Grid = r.map().getGridAt(ps.x, ps.y);
                        if (g.isCovered())
                            ps.canUseAt = true;
                        else if (g.getElem() && g.getElem() instanceof Monster)
                            ps.canUseAt = true;
                    }
                }, r, (ps) => ps.e.type == "Knife", false, true);
            })
        },

        // 剧毒之刃	每场战斗增加一把飞刀，飞刀攻击附加一层毒（每级+1，最高5）
        "PoisonKnife": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onCalcAttacking");
                    r.clearAIAtLogicPoint("onLevelInited");
                    return;
                }
                r = RelicFactory.addElemsOnLevelInit(r);
                r = <Relic>ElemFactory.addAI("onCalcAttacking", (ps) => {
                    ps.attackerAttrs.addBuffs.push({"type":"Poison", "rate":100, "ps":[r.attrs.poisonCnt ,1]});
                }, r, (ps) => ps.weapon && ps.weapon.type =="Knife", false, true);
            })
        },

        // 无尽之刃	每场战斗增加一把飞刀，飞刀杀死怪物后有15%的获得一把飞刀（每级+15，最高5）
        "InfinityKnife": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    r.clearAIAtLogicPoint("onAttacked");
                    return;
                }
                r = RelicFactory.addElemsOnLevelInit(r);
                r = <Relic>ElemFactory.addAI("onAttacked", async (ps) => {
                    var knife = ps.weapon;
                    if (r.bt().srand.next100() < r.attrs.percent){
                        var g = BattleUtils.findRandomEmptyGrid(r.bt(), false);
                        if (g){
                            var newKnife = r.bt().level.createElem("Knife");
                            await r.bt().implAddElemAt(newKnife, g.pos.x, g.pos.y);
                        }
                    }
                }, r, (ps) => ps.weapon && ps.weapon.type == "Knife" && ps.targetAttrs.owner.isDead())
            })
        },

        // 飞刀侦测	每场战斗增加一把飞刀，你知道所有飞刀的位置
        "KnifeDetector": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onStartupRegionUncoveredMark");
                    r.clearAIAtLogicPoint("onLevelInited");
                    return;
                }
                r = RelicFactory.addElemsOnLevelInit(r);
                r = <Relic>ElemFactory.addAI("onStartupRegionUncoveredMark", async () => {
                    var knives = r.bt().level.map.findAllElems((e:Elem) => !e.getGrid().isUncoveredOrMarked() && e.type == "Knife");
                    for (var knife of knives) {
                        await r.bt().fireEvent("onRelicEffect", {r:r});
                        await r.bt().implMark(knife.pos.x, knife.pos.y);
                    }
                }, r);
            })
        },

        // 怪物猎人,每场战斗开始时标记X个怪物（最多5级）
        "MonsterHunter": (attrs) => {
            return this.createRelic(attrs, false, (r: Relic, enable: boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onStartupRegionUncoveredMark");
                    return;
                }
                ElemFactory.addAI("onStartupRegionUncoveredMark", async () => {
                    var ms = BattleUtils.findRandomElems(r.bt(), attrs.markNum, (e: Elem) =>
                        !e.getGrid().isUncoveredOrMarked() && e instanceof Monster && e.isHazard() && !e.isBig() && e.type != "PlaceHolder");
                    for (var m of ms)
                        await r.bt().implMark(m.pos.x, m.pos.y);
                }, r)
            })
        },

        // 探索强化	一只怪物死亡，则随机显示一件物品的位置
        "ExploreEnhanced": (attrs) => {
            return this.createRelic(attrs, false, (r: Relic, enable: boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onElemChanged");
                    return;
                }
                ElemFactory.addAI("onElemChanged", async () => {
                    // 找到一个随机物品(即地图上不是怪物的元素,除开黑洞)
                    var e = BattleUtils.findRandomElems(r.bt(), 1, (e: Elem) => e.getGrid().isCovered() && !e.getGrid().isMarked() && !(e instanceof Monster) && e.type != "Hole")[0];
                    if (e)
                        await r.bt().implMark(e.pos.x, e.pos.y);
                }, r, (ps) => ps.subType == "die" && ps.e instanceof Monster && ps.e.isHazard() && ps.e.type != "PlaceHolder")
            })
        },

        // 园艺专精	每场战斗增加一个苹果，每次使用苹果额外回复一点生命
        "HorticultureProficient": (attrs) => {
            return this.createRelic(attrs, false, (r: Relic, enable: boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    r.clearAIAtLogicPoint("onPlayerHealing");
                    return;
                }
                r = <Relic>ElemFactory.addAI("onPlayerHealing", (ps) => {
                    ps.dhpPs.b += 1;
                }, r, (ps) => ps.source && ps.source.type == "Apple", false, true);
                r = RelicFactory.addElemsOnLevelInit(r);
            })
        },

        // 嗅觉强化	你知道所有食物的位置
        "SmellEnhanced": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onStartupRegionUncoveredMark");
                    r.clearAIAtLogicPoint("onLevelInited");
                    return;
                }
                ElemFactory.addAI("onStartupRegionUncoveredMark", async () => {
                    var fs = r.map().findAllElems((e:Elem) => e.getGrid().isCovered() && !e.getGrid().isMarked() && Utils.contains(e.attrs.tags, "food"));
                    for (var f of fs)
                        await r.bt().implMark(f.pos.x, f.pos.y);
                }, r)
                ElemFactory.addAI("onLevelInited", async () => {
                     var food = BattleUtils.findRandomElems(r.bt(), 1, (f:Elem) => Utils.contains(f.attrs.tags, "food"))[0];
                     if (food) {
                         var changeToDeluxeMeal = r.bt().srand.next100() < r.attrs.percent;
                         if (changeToDeluxeMeal) {
                             var pos = food.pos;
                             await r.bt().implRemoveElemAt(pos.x, pos.y);
                             var DeluxeMeal = r.bt().level.createElem("DeluxeMeal");
                             await r.bt().implAddElemAt(DeluxeMeal, pos.x, pos.y);
                         }
                     }                        
                }, r);
            })
        },

        // 囤积居奇	每当离开一场战斗地图，都可以带走随机一件已经揭开的非金钱物品到下一场战斗
        "Storer": (attrs) => {
             return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("beforeGoOutLevel1");
                    return;
                }
                ElemFactory.addAI("beforeGoOutLevel1", async () => {
                    var e = BattleUtils.findRandomElems(r.bt(), 1, (e:Elem) => {
                        var forbiddens = ["Coins", "Door", "TreasureBox", "Cocoon", "Hole", "IceBlock", "HeadBone", "NextLevelPort", "Rock"];
                        return !e.getGrid().isCovered() && e instanceof Item && Utils.indexOf(forbiddens, (s) => e.type == s) == -1
                    })[0];
                    if (e)
                        await r.bt().implElemFollow2NextLevel(e);
                }, r)
            })
        },

        // 盾牌专精	每场战斗增加一面盾牌，盾牌的恢复时间减少一回合
        "ShieldProficient": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    r.clearAIAtLogicPoint("onCalcCD");
                    return;
                }
                r = RelicFactory.addElemsOnLevelInit(r);
                <Relic>ElemFactory.addAI("onCalcCD", (ps) => {
                    ps.dcd.b -= r.attrs.dcd;
                }, r, (ps) => ps.subType == "resetCD" && ps.e.type == "Shield", false, true)
            })
        },

        // 圣甲虫的壳 每场战斗增加一面盾牌，盾牌的吸收伤害提升2点（每级+2，最高5级）
        "ShieldBlock": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    r.clearAIAtLogicPoint("onLevelCreateElem");
                    return;
                }
                r = RelicFactory.addElemsOnLevelInit(r);
                r = <Relic>ElemFactory.addAI("onLevelCreateElem", (ps) => {
                    var e:Elem = ps.e;
                    e["shield"] += r.attrs.dShield;
                }, r, (ps) => ps.type == "Shield", false, true);
            })
        },

        // 盾牌猛击	每场战斗增加一面盾牌，你可以将你的盾牌投掷出去造成不超过剩余吸收阈值的伤害，达到阈值后盾牌碎裂（boss技能）
        "ShieldSlam": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    r.clearAIAtLogicPoint("useWithTarget");
                    return;
                }
                r = RelicFactory.addElemsOnLevelInit(r);
                r = <Relic>ElemFactory.addAI("useWithTarget", (ps) => {
                    if (!ps.useWithTarget)
                        ps.useWithTarget = true;
                }, r, (ps) => ps.e.type == "Shield", false, true);
            })
        },

        // 盾牌流4	每场战斗增加一面盾牌，你知道所有盾牌的位置
        "ShieldDetector": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    r.clearAIAtLogicPoint("onStartupRegionUncoveredMark");
                    return;
                }                
                r = RelicFactory.addElemsOnLevelInit(r);
                r = <Relic>ElemFactory.addAI("onStartupRegionUncoveredMark", async () => {
                    var shields = r.bt().level.map.findAllElems((e:Elem) => !e.getGrid().isUncoveredOrMarked() && e.type == "Shield");
                    for (var shield of shields) {
                        await r.bt().fireEvent("onRelicEffect", {r:r});
                        await r.bt().implMark(shield.pos.x, shield.pos.y);
                    }
                }, r);
            })
        },

        // 园艺大师	获得植物的援护，每升一级提高植物属性
        "HorticultureMaster": (attrs) => {
            var r = this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onStartupRegionUncoveredAddPlant");
                    return;
                }
                ElemFactory.addAI("onStartupRegionUncoveredAddPlant", async (ps) => {
                    var bt = r.bt();
                    var level = Utils.filter(bt.player.relicsEquipped, (r:Relic) => r.type == "HorticultureMaster")[0].reinforceLv;
                    var pTypes = GCfg.getMiscConfig("PlantTypes");
                    var elemTypes = [];
                    for (var pType of pTypes)
                        elemTypes.push(pType + (level + 1).toString());
                    
                    var elemType = elemTypes[r.bt().srand.nextInt(0, elemTypes.length)];
                    var plant = bt.level.createElem(elemType, undefined, r.bt().player);
                    await r.bt().implAddElem2Area(plant, ps.ep.pos, ps.ep.attrs.size);
                }, r)
            })
            return r;
        },

        // 先发制人 初始的职业物品，会随机选择X（最多3级）件移动到初始区域
        "StrikeFirst": (attrs) => {
            var r = this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onStartupRegionUncovered");
                    return;
                }
                r = <Relic>ElemFactory.addAI("onStartupRegionUncovered", async (ps) => {
                    var bt = r.bt();
                    var ep = ps.ep;
                    // 找到在创建初始元素阶段根据职业配置加入的特定物品
                    var es = BattleUtils.findRandomElems(bt, r.attrs.moveNum, (e:Elem) => e["occupationInitItem"] && e.getGrid().isCovered());
                    for(var e of es){
                        var oriPos = {x:e.pos.x, y:e.pos.y};
                        var e = BattleUtils.moveElem2Area(bt, e, ep.pos, ep.attrs.size);
                        if (e) {
                            await r.bt().fireEvent("onElemImgFlying", {e:e, fromPos:oriPos, toPos:e.pos});
                            await bt.fireEvent("onGridChanged", {x:e.pos.x, y:e.pos.y, e:e, subType:"move2StartupRegion"});
                            await bt.triggerLogicPoint("onGridChanged", {x:e.pos.x, y:e.pos.y, e:e, subType:"move2StartupRegion"});
                        }
                    }
                }, r);
            })
            return r;
        },

        // 钟表匠 每层增加一个钟表,使用钟表回退步数+1(升级+1,最高5级)
        "Watchmaker": (attrs) => {
            var r = this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    r.clearAIAtLogicPoint("onUseClock");
                    return;
                }
                r = RelicFactory.addElemsOnLevelInit(r);
                r = <Relic>ElemFactory.addAI("onUseClock", (ps) => {
                    Utils.assert(ps.e.type == "Clock", "only effect on Clock.");
                    ps.deathStepBack += r.attrs.addDeathStepBack;
                }, r, undefined, false, true);
            })
            return r;
        },

        
        // 连击 攻击有护甲的单位时额外连击一次
        "DoubleAttack": (attrs) => {
            var r = this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if(!enable) {
                    r.clearAIAtLogicPoint("onGetAttackerAndTargetAttrs");
                    return;
                }
                r = <Relic>ElemFactory.addAI("onGetAttackerAndTargetAttrs", (ps) => {
                    ps.attackerAttrs.muiltAttack += 1;
                }, r, (ps) => ps.attackerAttrs.owner instanceof Player && ps.targetAttrs.owner.shield > 0 && !ps.weapon, false, true)
            });
            return r;
        },

        "":{}
    };

    // 每层增加n个相同Elem,Elem从给定的elemTypes里随机选取
    public static addElemsOnLevelInit(r:Relic):Relic{
        return <Relic>ElemFactory.addAI("onLevelInited", async (ps) => {
            var bt = r.bt();
            for(var i = 0; i < r.attrs.addOnLevelInit.num; i++){
                var g = BattleUtils.findRandomEmptyGrid(bt);
                if(g){
                    var elemType = r.attrs.addOnLevelInit.elems[r.bt().srand.nextInt(0, r.attrs.addOnLevelInit.elems.length)];
                    var e = bt.level.createElem(elemType, undefined, r.bt().player);
                    if (ps.skipAniSwitch && !Switch[ps.skipAniSwitch]())
                        bt.fireEventSync("onRelicEffect", {r:r, skipAniSwitch:ps.skipAniSwitch});
                    else
                        await bt.fireEvent("onRelicEffect", {r:r, skipAniSwitch:ps.skipAniSwitch});
                    await bt.implAddElemAt(e, g.pos.x, g.pos.y, undefined, ps.skipAniSwitch);
                }
            }
        }, r)
    }
}
