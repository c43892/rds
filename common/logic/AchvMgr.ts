// 成就管理器
class AchvMgr {
    public player:Player    

    // 检查是否获得新成就
    public async checkAchvGot(achvType) {
        var newAchvGot = false;
        var cfg = GCfg.getAchvCfg();
        switch (achvType){
            case "monsterKilled":{
                for (var achv in cfg){
                    var achvCfg = cfg[achv];
                    if (achvCfg["type"] == achvType && !this.checkAchvFinished(achv)) {
                        var condition = achvCfg["condition"];
                        if (Utils.loadAchvData(condition["type"] + "Killed") && Utils.loadAchvData(condition["type"] + "Killed") >= condition["killed"]){
                            this.preFinishAchv(achv);
                            await this.player.bt().fireEvent("onAchvFinished", {achvName:achv});
                        }
                    }
                }
                break;
            }
            case "multAchv":{
                break;
            }
        }
    }

    // 读取成就是否已经被完成
    public checkAchvFinished(achvName:string){
        return Utils.loadAchvData(achvName) == "finished" || Utils.contains(this.player.preFinishAchvs, achvName);
    }

    // 预完成某成就,在保存玩家信息时确定获得该成就
    public preFinishAchv(achvName:string){
        this.player.preFinishAchvs.push(achvName);
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
                    await am.checkAchvGot(type);
                    await am.checkAchvGot("multAchv");
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