class AchievementFactory {
    // 创建一个成就
    public createAchievement(cfg){
        var achv = new Achievement();
        achv.cfg = cfg;
        return achv;
    }

    // 给成就在特定逻辑点添加行为
    static addLogic(logicPoint:string, act, achv:Achievement, condition = undefined, sync = false):Achievement {
        var logicPointTrue = logicPoint + (sync ? "Sync" : "Async");
        var doPrior = achv[logicPointTrue];        
        if (sync) {
            achv[logicPointTrue] = (ps) => {
                if (doPrior != undefined)
                    doPrior(ps);

                if (!condition || condition(ps))
                    act(ps);
            }
        }
        else {
            achv[logicPointTrue] = async (ps) => {
                if (doPrior != undefined)
                    await doPrior(ps);

                if (!condition || condition(ps))
                    await act(ps);
            }
        }
        return achv;
    }

    public creator = {
        "HalloweenTreantNoPeashooter": (cfg) => {
            var achv = this.createAchievement(cfg);
            // 只在万圣节树妖战斗中生效
            achv = AchievementFactory.addLogic("onLevelInited", () => {
                achv.activated = true
            }, achv, (ps) => ps.bt.level.levelType == "halloweenTreant");

            // 有击杀怪物豌豆射手则失败
            achv = AchievementFactory.addLogic("onElemChanged", (ps) => {
                achv["fail"] = true;
            }, achv, (ps) => ps.subType == "dead" && ps.e.type == "MPeashooter" && achv.activated);
            achv = AchievementFactory.addLogic("onElemChanged", async (ps) => {
                await AchievementMgr.mgr.preFinishAchv(achv.type);
            }, achv, (ps) => ps.subType == "going2Die" && ps.e.type == "HalloweenTreant" && achv.activated && !achv["fail"]);

            // 需要刷新和存取的标记
            achv.refreshFields = ["activated", "fail"];
            achv = AchievementFactory.refreshAchvLogic(achv);
            
            return achv;
        },

        "DeepFrozen": (cfg) => {
            var achv = this.createAchievement(cfg);
            // 只在克拉肯战斗中生效
            achv = AchievementFactory.addLogic("onLevelInited", () => {achv.activated = true}, achv, (ps) => ps.bt.level.levelType == "kraken");

            // 受到深寒窒息的伤害时计数
            achv = AchievementFactory.addLogic("onKrakenDeepFrozen", () => {
                if (!achv["damageNum"])
                    achv["damageNum"] = 0;

                achv["damageNum"] ++;
            }, achv, undefined, true)

            // 击败克拉肯时检查受到的深寒窒息伤害
            achv = AchievementFactory.addLogic("onElemChanged", async (ps) => {
                await AchievementMgr.mgr.preFinishAchv(achv.type);
            }, achv, (ps) => ps.subType == "dead" && ps.e.type == "Kraken" && achv.activated && achv["damageNum"] >= 50);

            // 需要刷新和存取的标记
            achv.refreshFields = ["activated", "damageNum"];
            achv = AchievementFactory.refreshAchvLogic(achv);

            return achv;
        },

        "RichMan": (cfg) => {
            var achv = this.createAchievement(cfg);
            // 获得金币时累计并检查是否以到达预定数量
            achv = AchievementFactory.addLogic("onPlayerChanged", async (ps) => {
                if (!achv["getMoney"])
                    achv["getMoney"] = 0;
                
                achv["getMoney"] += ps.d;

                if (achv["getMoney"] >= achv.cfg.money) 
                    await AchievementMgr.mgr.preFinishAchv(achv.type);
            }, achv, (ps) => ps.subType == "money" && ps.d > 0);
            
            // 战斗外获得金币
            achv = AchievementFactory.addLogic("onPlayerGetMoneyOutside", (ps) => {
                if (!achv["getMoney"])
                    achv["getMoney"] = 0;
                
                achv["getMoney"] += ps.d;

                if (achv["getMoney"] >= achv.cfg.money)
                    AchievementMgr.mgr.preFinishAchv(achv.type);
            }, achv, undefined, true);

            // 需要刷新和存取的标记
            achv.refreshFields = ["getMoney"];
            achv.toStringFields = ["getMoney"];
            achv = AchievementFactory.refreshAchvLogic(achv);

            // 特殊的进度信息
            achv.finishedProgressInfo = () => {
                if (achv.isFinished()) 
                    return "已完成"; //return achv.cfg.money + " / " + achv.cfg.money;
                else
                    return (achv["getMoney"] ? (achv["getMoney"] > achv.cfg.money ? achv.cfg.money : achv["getMoney"]) : 0) + " / " + achv.cfg.money;
            }
            return achv;
        },

        "KnowlegdeChangesDestiny": (cfg) => {
            var achv = this.createAchievement(cfg);
            achv = AchievementFactory.addLogic("onElemChanged", async () => {
                if (!achv["readNum"])
                    achv["readNum"] = 0;
                
                achv["readNum"] ++;
                if (achv["readNum"] >= achv.cfg.readNum)
                    await AchievementMgr.mgr.preFinishAchv(achv.type);
            }, achv, (ps) => ps.subType == "dead" && Utils.contains(ps.e.attrs.tags, "book"));

            // 需要刷新和存取的标记
            achv.refreshFields = ["readNum"];
            achv.toStringFields = ["readNum"];
            achv = AchievementFactory.refreshAchvLogic(achv);

            // 特殊的进度信息
            achv.finishedProgressInfo = () => {
                if (achv.isFinished()) 
                    return "已完成"; //return achv.cfg.readNum + " / " + achv.cfg.readNum;
                else
                    return (achv["readNum"] ? (achv["readNum"] > achv.cfg.readNum ? achv.cfg.readNum : achv["readNum"]) : 0) + " / " + achv.cfg.readNum;
            }

            return achv;
        },

        "DeathGodKiller": (cfg) => {
            var achv = this.createAchievement(cfg);
            achv = AchievementFactory.addLogic("onElemChanged", async () => {
                if (!achv["killNum"])
                    achv["killNum"] = 0;
                
                achv["killNum"] ++;
                if (achv["killNum"] >= achv.cfg.killNum)
                    await AchievementMgr.mgr.preFinishAchv(achv.type);
            }, achv, (ps) => ps.subType == "dead" && ps.e.type == "DeathGod");

            // 需要刷新和存取的标记
            achv.refreshFields = ["killNum"];
            achv.toStringFields = ["killNum"];
            achv = AchievementFactory.refreshAchvLogic(achv);

            // 特殊的进度信息
            achv.finishedProgressInfo = () => {
                if (achv.isFinished()) 
                    return "已完成"; //return achv.cfg.killNum + " / " + achv.cfg.killNum;
                else
                    return (achv["killNum"] ? (achv["killNum"] > achv.cfg.killNum ? achv.cfg.killNum : achv["killNum"]) : 0) + " / " + achv.cfg.killNum;
            }

            return achv;
        },

        "SkillMaster": (cfg) => {
            var achv = this.createAchievement(cfg);
            achv = AchievementFactory.addLogic("onRelicChanged", async (ps) => {
                var relic:Relic = Utils.filter(achv.mgr.player.allRelics, (r:Relic) => r.type == ps.e.type)[0];
                // 获得技能时检查技能等级是否达到要求
                if (relic.reinforceLv >= achv.cfg.relicLv){
                    if (!achv["relicValid"])
                        achv["relicValid"] = [];
                    
                    if (!Utils.contains(achv["relicValid"], relic.type))
                        achv["relicValid"].push(relic.type);
                }
                // 检查达到要求的技能数量
                if (achv["relicValid"] && achv["relicValid"].length >= achv.cfg.relicNum)
                    await AchievementMgr.mgr.preFinishAchv(achv.type);
            }, achv, (ps) => ps.subType == "addRelic");

            // 在战斗外获得技能
            achv = AchievementFactory.addLogic("onAddRelicOutside", (ps) => {
                var relic:Relic = Utils.filter(achv.mgr.player.allRelics, (r:Relic) => r.type == ps.relicType)[0];
                if (relic.reinforceLv >= achv.cfg.relicLv){
                    if (!achv["relicValid"])
                        achv["relicValid"] = [];
                    
                    if (!Utils.contains(achv["relicValid"], relic.type))
                        achv["relicValid"].push(relic.type);
                }
                if (achv["relicValid"] && achv["relicValid"].length >= achv.cfg.relicNum)
                    AchievementMgr.mgr.preFinishAchv(achv.type);

            }, achv, undefined, true);
            
            // 需要刷新和存取的标记
            achv.refreshFields = ["relicValid"];
            achv.toStringFields = ["relicValid"];
            achv = AchievementFactory.refreshAchvLogic(achv);

            // 特殊的进度信息
            achv.finishedProgressInfo = () => {
                if (achv.isFinished()) 
                    return "已完成"; //return achv.cfg.relicNum + " / " + achv.cfg.relicNum;                    
                else
                    return (achv["relicValid"] ? (achv["relicValid"].length > achv.cfg.relicNum ? achv.cfg.relicNum : achv["relicValid"].length) : 0) + " / " + achv.cfg.relicNum;
            }
            return achv;
        },

        "EasyModeUnlock": (cfg) => {
            var achv = this.createAchievement(cfg);
            achv = AchievementFactory.addLogic("onGameEnd", async () => {
                // 通关30层解锁简单难度
                if (achv.mgr.player.currentTotalStorey() >= 30 && Utils.getDiffByAchvData() < 2)
                    await AchievementMgr.mgr.preFinishAchv(achv.type);
                
            }, achv, () => !!achv.mgr.player);
            return achv;
        },

        "NormalModeUnlock": (cfg) => {
            var achv = this.createAchievement(cfg);
            achv = AchievementFactory.addLogic("onGameEnd", async () => {
                // 通关45层解锁普通难度
                if (achv.mgr.player.currentTotalStorey() >= 45 && Utils.getDiffByAchvData() < 3)
                    await AchievementMgr.mgr.preFinishAchv(achv.type);
                
            }, achv, () => !!achv.mgr.player);
            return achv;
        }
    }

    static refreshAchvLogic(achv:Achievement){
        switch (achv.achvClass()) {
            // 单场战斗内有效的成就
            case "singleBattle":{
                achv = AchievementFactory.addLogic("refreshAchvOnBattleEnd", () => {
                    for(var field of achv.refreshFields)
                        achv[field] = undefined;
                }, achv, undefined, true);
                break;
            }
            // 单局游戏内有效的成就
            case "singleGame":{
                achv = AchievementFactory.addLogic("refreshAchvOnGameEnd", () => {
                    for(var field of achv.refreshFields)
                        achv[field] = undefined;
                }, achv, undefined, true);
                break;
            }
        }
        return achv;
    }
}