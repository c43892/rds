
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
            e.enabledFuncs.push(0);
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
            e.beforeRinforceLvUp = () => e.removeAllEffects();
            e.afterPlayerActed = () => {
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
                if (!enable) return;
                ElemFactory.addAI("beforeGoOutLevel2", async () => r.bt().implAddPlayerHp(r.attrs.dhp, r), r)
            });
        },

        // 鹰眼，每关开始前标注一个带钥匙的怪物
        "Hawkeye": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) return;
                ElemFactory.addAI("onStartupRegionUncovered", async () => {
                    var ms = BattleUtils.findRandomElems(r.bt(), 1, (m) => {
                        if (!(m instanceof Monster)) return false;
                        if (!m.getGrid().isCovered()) return false;
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
                if (!enable) return;
                ElemFactory.addAI("beforeGoOutLevel2", async () => {
                    await r.bt().implAddDeathGodStep(attrs.deathGodBackStep, r);
                }, r);
            });
        },

        // 耐力
        "Endurance": (attrs) => {
            return this.createRelic(attrs, true, (r:Relic, enable:boolean) => {
                r.player.addMaxHp(enable ? attrs.dMaxHp : -attrs.dMaxHp);
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
                r.player.dodge += (enable ? attrs.dDodge : -attrs.dDodge);
            });
        },

        // 凶暴
        "Fierce": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) return;
                ElemFactory.addAI("onCalcAttacking", async (ps) => {
                    ps.attackerAttrs.critical.b += attrs.dSneakCritical; // 增加暴击率
                }, r, (ps) => ps.subType == "player2monster" && Utils.contains(ps.targetAttrs.targetFlags, "Sneaked"));
            });
        },

        // 先动，免疫突袭时的反击
        "Unback2Sneak": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) return;
                ElemFactory.addAI("onAttacked", async (ps) => {
                    ps.attackerAttrs.attackFlags.push("immuneAttackBack");
                }, r, (ps) => {
                    return ps.subType == "player2monster" && Utils.contains(ps.targetAttrs.targetFlags, "Sneaked")});
            });
        },

        // 十字架,阻止怪物复活
        "Crucifix": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) return;
                ElemFactory.addAI("onElemRevive", async (ps) => {
                    if(!ps.achieve) return;

                    ps.achive = false;
                }, r)
            })
        },

        // 武器大师
        "WeaponMaster": (attrs) => {
            return this.createRelic(attrs, true, (r:Relic, enable:boolean) => {
                if (!enable) return;
                ElemFactory.addAI("onLevelInited", async () => {
                   var bt = r.bt();
                    var g = BattleUtils.findRandomEmptyGrid(bt);
                    if(g)
                        await bt.implAddElemAt(bt.level.createElem("Baton"), g.pos.x, g.pos.y);
                }, r)
            })
        },

        // 每翻开20个空格，角色获得一点护甲（每升一级降低2个空格，最高5）
        "UndefinedName1": (attrs) => {
            var thisRelic = this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) return;
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
                if (!enable) return;
                ElemFactory.addAI("onElemChanged", async () => {
                    await r.bt().implAddPlayerExp(attrs.dexp);
                }, r, (ps) => ps.subType = "die" && ps.e instanceof Monster && ps.e.isHazard())
            })
        },

        // 每个怪物掉落的金钱增加1，每升一级提高1，最高5
        "UndefinedName3": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) return;
                ElemFactory.addAI("onElemChanged", async (ps) => {
                    var m = <Monster>ps.e;
                    if(Utils.indexOf(m.dropItems, (e:Elem) => e.type == "Coins") < 0) return;
                                        
                    m.addDropItem(m.bt().level.createElem("Coins", {cnt:1}));
                }, r, (ps) => ps.subType = "preDie" && ps.e instanceof Monster)
            })
        },
        
        "":{}
    };
}
