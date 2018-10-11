
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

        // 鹰眼，每关开始前标注一个带钥匙的怪物
        "Hawkeye": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onStartupRegionUncovered");
                    return
                };
                ElemFactory.addAI("onStartupRegionUncovered", async () => {
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
                    ps.attackerAttrs.critical.b += attrs.dSneakCritical; // 增加暴击率
                }, r, (ps) => ps.subType == "player2monster" && Utils.contains(ps.targetAttrs.targetFlags, "Sneaked"), false, true);
            });
        },

        // 先动，免疫突袭时的反击
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
                    r.clearAIAtLogicPoint("onElemRevive");
                    return;
                }
                ElemFactory.addAI("onElemRevive", async (ps) => {
                    if(!ps.achieve)
                        return;

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

        // 杀死怪物可以额外获得1点经验，每升一级提高1，最高5
        "UndefinedName2": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onElemChanged");
                    return;
                }
                ElemFactory.addAI("onElemChanged", async () => {
                    await r.bt().implAddPlayerExp(attrs.dexp, r.pos);
                }, r, (ps) => ps.subType == "die" && ps.e instanceof Monster && ps.e.isHazard())
            })
        },

        // 每个怪物掉落的金钱增加1，每升一级提高1，最高5
        "UndefinedName3": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onElemChanged");
                    return;
                }
                ElemFactory.addAI("onElemChanged", async (ps) => {
                    var m = <Monster>ps.e;
                    if(Utils.indexOf(m.dropItems, (e:Elem) => e.type == "Coins") < 0) return;
                                        
                    m.addDropItem(m.bt().level.createElem("Coins", {cnt:attrs.num}));
                }, r, (ps) => ps.subType == "preDie" && ps.e instanceof Monster)
            })
        },

        // 防护专精,每层额外增加一件防护服
        "DefenseProficient": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    return;
                }                
                r = RelicFactory.addElemsOnLevelInit(r);
            })
        },

        // 图书大师,每层额外增加一本书
        "BookMaster": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    return;
                }                
                r = RelicFactory.addElemsOnLevelInit(r);
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
                    r.clearAIAtLogicPoint("onStartupRegionUncovered");
                    return;
                }
                ElemFactory.addAI("onStartupRegionUncovered", async () => {
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

        // 怪物猎人,每场战斗开始时标记X个怪物（最多5级）
        "MonsterHunter": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onStartupRegionUncovered");
                    return;
                }
                ElemFactory.addAI("onStartupRegionUncovered", async () => {
                    var ms = BattleUtils.findRandomElems(r.bt(), attrs.markNum, (e:Elem) => e.getGrid().isCovered() && !e.getGrid().isMarked() && e instanceof Monster && e.isHazard());
                    for (var m of ms)
                        await r.bt().implMark(m.pos.x, m.pos.y);
                }, r)
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

        // 探索强化	一只怪物死亡，则随机显示一件物品的位置
        "ExploreEnhanced": (attrs) => {
            return this.createRelic(attrs, false, (r: Relic, enable: boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onElemChanged");
                    return;
                }
                ElemFactory.addAI("onElemChanged", async () => {
                    var e = BattleUtils.findRandomElems(r.bt(), 1, (e: Elem) => e.getGrid().isCovered() && !e.getGrid().isMarked() && !(e instanceof Monster))[0];
                    if (e)
                        await r.bt().implMark(e.pos.x, e.pos.y);
                }, r, (ps) => ps.subType == "die" && ps.e instanceof Monster && ps.e.isHazard())
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
                    r.clearAIAtLogicPoint("onStartupRegionUncovered");
                    return;
                }
                ElemFactory.addAI("onStartupRegionUncovered", async () => {
                    var fs = r.map().findAllElems((e:Elem) => e.getGrid().isCovered() && !e.getGrid().isMarked() && Utils.contains(e.attrs.tags, "food"));
                    for (var f of fs)
                        await r.bt().implMark(f.pos.x, f.pos.y);
                }, r)
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
                <Relic>ElemFactory.addAI("onCalcCD", (ps) => {
                    ps.dcd.b += r.attrs.dcd;
                }, r, (ps) => ps.subType == "resetCD" && ps.e.type == "Shield", false, true)
                r = RelicFactory.addElemsOnLevelInit(r);
            })
        },

        // 园艺大师	获得植物的援护，每升一级提高植物属性
        "HorticultureMaster": (attrs) => {
            var r = this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) {
                    r.clearAIAtLogicPoint("onLevelInited");
                    return;
                }
                ElemFactory.addAI("onLevelInited", async () => {
                    var bt = r.bt();
                    var level = Utils.filter(bt.player.relicsEquipped, (r:Relic) => r.type == "HorticultureMaster")[0].reinforceLv;
                    var pTypes = ["NutWall", "Peashooter", "CherryBomb", "Sunflower", "CharmingMushroom"];
                    var elemTypes = [];
                    for (var pType of pTypes)
                        elemTypes.push(pType + (level + 1).toString());

                    var g = BattleUtils.findRandomEmptyGrid(bt);
                    if(g){
                        var elemType = elemTypes[r.bt().srand.nextInt(0, elemTypes.length)];
                        await bt.fireEvent("onRelicAddElem", {r:r});
                        await bt.implAddElemAt(bt.level.createElem(elemType, undefined, r.bt().player), g.pos.x, g.pos.y);
                    }
                    
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
                    var es = BattleUtils.findRandomElems(bt, r.attrs.moveNum, (e:Elem) => e["occupationInitItem"]);
                    for(var e of es){
                        var e = BattleUtils.moveElem2Area(bt, e, ep.pos, ep.attrs.size);
                        if (e) {
                            await bt.fireEvent("onGridChanged", {x:e.pos.x, y:e.pos.y, e:e, subType:"moveShopNpc"});
                            await bt.triggerLogicPoint("onGridChanged", {x:e.pos.x, y:e.pos.y, e:e, subType:"moveShopNpc"});
                        }
                    }
                }, r);
            })
            return r;
        },

        "":{}
    };

    // 每层增加n个相同Elem,Elem从给定的elemTypes里随机选取
    public static addElemsOnLevelInit(r:Relic):Relic{
        return <Relic>ElemFactory.addAI("onLevelInited", async () => {
            var bt = r.bt();
            for(var i = 0; i < r.attrs.addOnLevelInit.num; i++){
                var g = BattleUtils.findRandomEmptyGrid(bt);
                if(g){
                    var elemType = r.attrs.addOnLevelInit.elems[r.bt().srand.nextInt(0, r.attrs.addOnLevelInit.elems.length)];
                    await bt.fireEvent("onRelicAddElem", {r:r});
                    await bt.implAddElemAt(bt.level.createElem(elemType, undefined, r.bt().player), g.pos.x, g.pos.y);
                }
            }
        }, r)
    }
}
