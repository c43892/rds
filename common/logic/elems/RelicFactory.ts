
// 遗物刚被创建时，是一个 item，其拾取操作，才生成一个遗物到玩家身上
class RelicFactory {

    // 创建一个遗物在地图上的包装对象
    createRelic(attrs, needResetOnReinforceLvUp:boolean, ...funcs):Relic {
        var e = new Relic();
        e.canUse = () => true;
        e.canBeDragDrop = true;
        var cd = 0;
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
                ElemFactory.addAI("beforeGoOutLevel2", async () => r.bt().implAddPlayerHp(r.attrs.dhp), r)
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

        // 披风，免疫一次偷袭
        "Cloak": (attrs) => {
            return this.createRelic(attrs, false, (r:Relic, enable:boolean) => {
                if (!enable) return;
                ElemFactory.triggerColddownLogic(
                ElemFactory.addAI("onSneaking", async (ps) => {
                    if (ps.immunized) return;
                    ps.immunized = true;
                    r.resetCD();
                    Utils.log("immunize sneak");
                }, r, () => r.checkCD()));
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
        
        "":{}
    };
}
