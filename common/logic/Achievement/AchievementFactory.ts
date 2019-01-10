class AchievementFactory {
    // 创建一个成就
    static createAchievement(type){
        var achv = new Achievement();
        achv.type = type;
        achv.cfg = GCfg.getAchvCfg()[type];
        achv = AchievementFactory.creator[type](achv);
        return achv;
    }

    // 给成就在特定逻辑点添加行为
    static addLogic(logicPoint, act, achv:Achievement, condition = undefined, sync = false){
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

    static creator = {
        "HalloweenTreantNoPeashooter": (achv:Achievement) => {
            // 只在万圣节树妖战斗中生效
            achv = AchievementFactory.addLogic("onLevelInited", (ps) => {
                var bt:Battle = ps.bt;
                if (bt.level.levelType != "halloweenTreant") return;
                
                achv.activated = true;
            }, achv);

            // 有击杀怪物豌豆射手则失败
            achv = AchievementFactory.addLogic("onElemChanged", (ps) => {
                achv["fail"] = true;
            }, achv, (ps) => ps.subType == "dead" && ps.e.type == "MPeashooter" && achv.activated);
            achv = AchievementFactory.addLogic("onElemChanged", async (ps) => {
                await AchievementMgr.mgr.preFinishAchv(achv.type);
            }, achv, (ps) => ps.subType == "dead" && ps.e.type == "HalloweenTreant" && achv.activated && !achv["fail"]);

            // 需要刷新和存取的标记
            achv.refreshFields = ["activated", "fail"];
            achv = AchievementFactory.refreshAchvLogic(achv);

            return achv;
        },

        "DeepFrozen": (achv:Achievement) => {
            // 只在克拉肯战斗中生效
            achv = AchievementFactory.addLogic("onLevelInited", (ps) => {
                var bt:Battle = ps.bt;
                if (bt.level.levelType != "kraken") return;
                
                achv.activated = true;
            }, achv);

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

        "RichMan": (achv:Achievement) => {
            achv = AchievementFactory.addLogic("onPlayerChanged", async (ps) => {
                if (!achv["getMoney"])
                    achv["getMoney"] = 0;
                
                achv["getMoney"] += ps.dm;

                if (achv["getMoney"] >= achv.cfg.money) 
                    await AchievementMgr.mgr.preFinishAchv(achv.type);
            }, achv, (ps) => ps.subType == "money" && ps.d > 0);

            achv = AchievementFactory.addLogic("onPlayerGetMoneyOutside", (ps) => {
                if (!achv["getMoney"])
                    achv["getMoney"] = 0;
                
                achv["getMoney"] += ps.dm;

                if (achv["getMoney"] >= achv.cfg.money) {}

                
            }, achv, true);

            // 需要刷新和存取的标记
            achv.refreshFields = ["getMoney"];
            achv.toStringFields = ["getMoney"];
            achv = AchievementFactory.refreshAchvLogic(achv);
            return achv;
        },

        "KnowlegdeChangesDestiny": (achv:Achievement) => {
             achv = AchievementFactory.addLogic("onElemChanged", async () => {
                if (!achv["readNum"])
                    achv["readNum"] = 0;
                
                achv["readNum"] ++;
                if (achv["readNum"] >= achv.cfg.readNum)
                    await AchievementMgr.mgr.preFinishAchv(achv.type);
            }, achv, (ps) => ps.subType = "dead" && Utils.contains(ps.e.attrs.tags, "book"));

            // 需要刷新和存取的标记
            achv.refreshFields = ["readNum"];
            achv.toStringFields = ["readNum"];
            achv = AchievementFactory.refreshAchvLogic(achv);
            return achv;
        },

        "DeathGodKiller": (achv:Achievement) => {
            achv = AchievementFactory.addLogic("onElemChanged", async () => {
                if (!achv["killNum"])
                    achv["killNum"] = 0;
                
                achv["killNum"] ++;
                if (achv["killNum"] >= achv.cfg.killNum)
                    await AchievementMgr.mgr.preFinishAchv(achv.type);
            }, achv, (ps) => ps.subType = "dead" && ps.e.type == "DeathGod");

            // 需要刷新和存取的标记
            achv.refreshFields = ["killNum"];
            achv.toStringFields = ["killNum"];
            achv = AchievementFactory.refreshAchvLogic(achv);
            return achv;
        },

        "SkillMaster": (achv:Achievement) => {
            achv = AchievementFactory.addLogic("onRelicChanged", async (ps) => {
                var relic:Relic = Utils.filter(achv.mgr.player.allRelics, (r:Relic) => r.type == ps.e.type)[0];
                if (relic.reinforceLv >= achv.cfg.relicLv){
                    if (!achv["relicValid"])
                        achv["relicValid"] = [];
                    
                    if (!Utils.contains(achv["relicValid"], relic.type))
                        achv["relicValid"].push(relic.type);
                }

                if (achv["relicValid"].length >= achv.cfg.relicNum)
                    await AchievementMgr.mgr.preFinishAchv(achv.type);
            }, achv, (ps) => ps.subType == "addRelic");

            achv = AchievementFactory.addLogic("onAddRelicOutside", (ps) => {
                var relic:Relic = Utils.filter(achv.mgr.player.allRelics, (r:Relic) => r.type == ps.e.type)[0];
                if (relic.reinforceLv >= achv.cfg.relicLv){
                    if (!achv["relicValid"])
                        achv["relicValid"] = [];
                    
                    if (!Utils.contains(achv["relicValid"], relic.type))
                        achv["relicValid"].push(relic.type);
                }
                if (achv["relicValid"].length >= achv.cfg.relicNum){}

            }, achv, undefined, true);
            
            // 需要刷新和存取的标记
            achv.refreshFields = ["relicValid"];
            achv.toStringFields = ["relicValid"];
            achv = AchievementFactory.refreshAchvLogic(achv);
            return achv;
        },

        "NormalMode": (achv:Achievement) => {
            achv = AchievementFactory.addLogic("onGameEnd", () => {
                if (achv.mgr.player.currentTotalStorey() >= 30 && (!Utils.loadAchvData("availableDiff") || Utils.loadAchvData("availableDiff") < 2))
                    Utils.saveAchvData("availableDiff", 2);
            }, achv);
            return achv;
        },

        "DifficultyMode": (achv:Achievement) => {
            achv = AchievementFactory.addLogic("onGameEnd", () => {
                if (achv.mgr.player.currentTotalStorey() >= 45 && (!Utils.loadAchvData("availableDiff") || Utils.loadAchvData("availableDiff") < 3))
                    Utils.saveAchvData("availableDiff", 3);
            }, achv);
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