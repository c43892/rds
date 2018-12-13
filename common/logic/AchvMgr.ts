// 成就管理器
class AchvMgr {
    public player:Player
    public preFinishAchvs = []; // 装着所有预完成的成就,成就只会在保存角色信息时真正的被完成

    // 检查是否获得新成就
    public async checkAchvGot(achvType) {
        var newAchvGot = false;
        var cfg = GCfg.getAchvCfg();
        for (var achv in cfg) {
            var achvCfg = cfg[achv];
            // 只分析对应achvType的成就并根据成就类型进行判断
            if (achvCfg["type"] == achvType && !this.checkAchvFinished(achv)) {
                switch (achvType) {
                    // 杀敌数类型成就
                    case "monsterKilled": {
                        // 只检查该成就未完成的阶段
                        var stages = achvCfg["stages"];
                        var stage = Utils.loadAchvData(achv);
                        stage = stage != undefined ? stage : -1;
                        for(var i = stage + 1; i < stages.length; i++){
                            if (!this.checkAchvFinished(achv, i)){
                                var stage = stages[i];
                                var condition = stage["condition"];
                                if (Utils.loadAchvData(condition["type"] + "Killed") && Utils.loadAchvData(condition["type"] + "Killed") >= condition["killed"]) {
                                    this.preFinishAchv(achv, i);
                                    newAchvGot = true;
                                    await this.player.bt().fireEvent("onAchvFinished", { achvName: achv , stage:i});
                                }
                            }
                        }
                        break;
                    }
                    // 多成就复合型成就
                    case "multAchv": {
                        var conditions = achvCfg["conditions"];
                        var b = true;
                        for (var condition of conditions){
                            if (!this.checkAchvFinished(condition))
                                b = false;
                        }
                        if (b){
                            this.preFinishAchv(achv, "finished");
                            newAchvGot = true;
                            await this.player.bt().fireEvent("onAchvFinished", { achvName: achv , stage:"finished"});
                        }
                        break;
                    }
                }
            }
        }
        return newAchvGot;
    }

    // 读取成就是否已经被完成或已经完成到某阶段(包括预完成)
    public checkAchvFinished(achvName:string, stage = undefined){
        if (Utils.loadAchvData(achvName) && (Utils.loadAchvData(achvName) == "finished" || (stage && Utils.loadAchvData(achvName) >= stage)))
            return true;
        else if (this.checkAchvPreFinished(achvName, stage))
            return true;
        else
            return false;
    }

    // 成就是否被预完成或已经完成到某阶段
    public checkAchvPreFinished(achvName:string, stage){
        return Utils.indexOf(this.preFinishAchvs, (achvInfo) => achvInfo.achvName == achvName 
        && (achvInfo.stage == "finished" || (stage && achvInfo.stage == stage)) ) > -1;
    }

    // 预完成某成就
    public preFinishAchv(achvName:string, stage){
        Utils.assert(Utils.loadAchvData(achvName) != "finished" && (!Utils.loadAchvData(achvName) || Utils.loadAchvData(achvName) < stage),
            "had finished higher stage of achv:" + achvName);
        // 如果是最后一个阶段,要标记为完全完成
        if (stage != "finished" && stage == GCfg.getAchvCfg()[achvName]["stages"].length - 1)
            stage = "finished";
        this.preFinishAchvs.push({achvName:achvName, stage:stage});
    }

    // 获取某成就的完成进度
    public static getAchvFinishedPercent(achvName:string){

    }
}

class AchvMgrFactory {
    public static logicPoints = ["onElemChanged"];

    public static createAchvMgr(p:Player){
        var am = new AchvMgr();
        am.player = p;
        for (var lp of AchvMgrFactory.logicPoints){
            var func = async (ps) => {
                var type = await AchvMgrFactory[lp](ps);
                if (type){
                    var newAchvGot = await am.checkAchvGot(type);
                    while (newAchvGot)
                        newAchvGot = await am.checkAchvGot("multAchv");
                }
            }
            am[lp + "Async"] = func;
            am[lp + "Sync"] = func;
        }
        return am;
    }

    public static async onElemChanged(ps) {
        // 怪物死亡统计
        if (ps.subType == "die" && ps.e instanceof Monster && ps.e.isHazard() && ps.e.type != "PlaceHolder") {
            var m = <Monster>ps.e;
            var killed = Utils.loadAchvData(m.type + "Killed");
            killed = killed ? killed : 0;
            killed ++;
            Utils.saveAchvData(m.type + "Killed", killed);
            return "monsterKilled";
        }
    }
}