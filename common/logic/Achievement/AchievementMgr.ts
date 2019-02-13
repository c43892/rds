class AchievementMgr {
    public player:Player;
    public allAchvs:Achievement[] = []; // 所有成就
    public unfinishedAchvs:Achievement[] = []; // 未完成的成就,只有未完成的成就需要响应相关逻辑,已完成的基本只需要在表现时使用.
    public mv:MainView;
    private factory:AchievementFactory;
    private achvCfg;

    static mgr:AchievementMgr;

    // 存放预完成成就
    public preFinishedAchv = {
        singleBattle:[],
        singleGame:[],
        last:[]
    }

    // 汇总预完成成就
    public allPreFinishedAchvs = () => [...this.preFinishedAchv.singleBattle, ...this.preFinishedAchv.singleGame,...this.preFinishedAchv.last];

    // 根据配置生成成就并装入管理器
    static createAchvMgr(){
        var mgr = new AchievementMgr();
        mgr.factory = new AchievementFactory();
        mgr.allAchvs = [];
        mgr.achvCfg = GCfg.getAchvCfg();
        for (var type in mgr.achvCfg){
            var cfg = mgr.achvCfg[type];
            var achv = <Achievement>mgr.factory.creator[type](cfg);
            achv.type = type;
            achv.mgr = mgr;
            mgr.allAchvs.push(achv);
        }
        mgr.refresh();
        return mgr;
    }

    public refresh(){
        this.unfinishedAchvs = [];
        for (var achv of this.allAchvs)
            if (!achv.isFinished())
                this.unfinishedAchvs.push(achv);        
    }

    // 预完成一个成就
    public async preFinishAchv(type, finishedStage = undefined) {
        var achv = this.allAchvs[Utils.indexOf(this.allAchvs, (achv:Achievement) => achv.type == type)];
        Utils.assert(!!achv, "can not find this achievement, type: " + type);
        // 如果预完成的是最后一个阶段,则将该成就预完成
        if (finishedStage && finishedStage == achv.stages())
            finishedStage = undefined;

        var preFinishInfo = {type:type, isFinished:!finishedStage, finishedStage:finishedStage};
        this.preFinishedAchv[achv.achvClass()].push(preFinishInfo);

        // 不是阶段完成而是全部完成
        if (!finishedStage)
            this.unfinishedAchvs = Utils.removeFirstWhen(this.unfinishedAchvs, (achv:Achievement) => achv.type == type);

        if (!!this.player && this.player.bt())
            await this.player.bt().fireEvent("onPreFinishAchv", preFinishInfo);
        else
            await this.mv.openNewAchvView(achv);
        
    }

    // 完成某个成就并存档
    public finishAchvAndSave(preFinishInfo) {
        if (preFinishInfo.isFinished)
            Utils.saveAchvData(preFinishInfo.type, "finished");
        else 
            Utils.saveAchvData(preFinishInfo.type, preFinishInfo.finishedStage);
        
        var achvClass = GCfg.getAchvCfg()[preFinishInfo.type]["achvClass"];
        this.preFinishedAchv[achvClass] = Utils.removeFirstWhen(this.preFinishedAchv[achvClass], (preInfo) =>
            (preInfo.type == preFinishInfo.type) && (preInfo.isFinished == preFinishInfo.isFinished) 
            && (!preInfo.finishedStage || preInfo.finishedStage == preFinishInfo.finishedStage));
    }

    // 获取总成就点
    public getTotalAchvPoint(){
        var p = 0;
        for (var achv of this.allAchvs){
            var finishedStage = achv.finishedStage();
            if (finishedStage == -1)
                p += achv.cfg.achvPoint;
            else if (finishedStage > 0){
                var ap = 0;
                for (var i = 0; i < finishedStage; i++)
                    ap += achv.cfg.achvPoints[i];

                p += ap;
            }
        }
        return p;
    }

    // 手动触发某个逻辑点,通常是因为不在战斗内
    // 同步的
    public actOnLogicPointSync(logicPoint:string, ps = undefined){
        var logicPointTrue = logicPoint + "Sync";
        for (var achv of this.unfinishedAchvs)
            if (achv[logicPointTrue])
                achv[logicPointTrue](ps);        
    }
    // 异步的
    public async actOnLogicPoint(logicPoint:string, ps = undefined){
        var logicPointTrue = logicPoint + "Async";
        for (var achv of this.unfinishedAchvs)
            if (achv[logicPointTrue])
                await achv[logicPointTrue](ps);
    }

    // 成就奖励相关
    // 某个成就奖励的状态
    public static getAchvAwardStatus(awardName:string){
        var status = Utils.loadAchvData(awardName);
        if (status && status == "received") return status;
        else {
            if (AchievementMgr.isAchvAwardValid(awardName))
                return "wait4Receive";
            else 
                return "unfinished";
        }
    }

    // 某个成就奖励是否可以领取
    private static isAchvAwardValid(awardName:string){
        var awardInfo = GCfg.getAchvAwardCfg()[awardName];
        var valid = false;
        switch (awardInfo.type) {
            case "achvFinished": {  
                var achv = <Achievement>Utils.filter(AchievementMgr.mgr.allAchvs, (achv:Achievement) => achv.type == awardInfo.achv)[0];
                Utils.assert(!!achv, "no such achievement, type: " + awardInfo.achv);
                if (achv.isFinished())
                    valid = true;

                break;
            }
            case "achvStageFinished": {
                var achv = <Achievement>Utils.filter(AchievementMgr.mgr.allAchvs, (achv:Achievement) => achv.type == awardInfo.achv)[0];
                if (achv.finishedStage() == -1 || achv.finishedStage() >= awardInfo)
                    valid = true;

                break;
            }
            case "achvPoint": {
                if (AchievementMgr.mgr.getTotalAchvPoint() >= awardInfo.achvPoint)
                    valid = true;

                break;
            }
        }
        return valid;
    }

    // 领取成就奖励
    public static receiveAchvAward(awardName:string) {
        Utils.assert(AchievementMgr.getAchvAwardStatus(awardName) == "wait4Receive", "this award is not ready");
        var awardInfo = GCfg.getAchvAwardCfg()[awardName];
        switch (awardInfo.awardContent.type) {
            case "unlockRelic":{
                var unlocked = Utils.loadAchvData("unlockedRelics");
                if (!unlocked)
                    unlocked = [];
                
                unlocked.push(awardInfo.awardContent.relic);
                Utils.saveAchvData("unlockedRelics", unlocked);
                break;
            }
        }
        Utils.saveAchvData(awardName, "received");
    }

    public toString() {
        var mgrInfo = {};
        for(var achv of this.unfinishedAchvs) {
            if (achv.achvClass() == "singleGame" && achv.toStringFields.length > 0){
                mgrInfo[achv.type] = {type:achv.type};
                for (var toStringField of achv.toStringFields){
                    mgrInfo[achv.type][toStringField] = achv[toStringField];
                }
            }
        }
        return mgrInfo;
    }

    public fromString(mgrInfo) {
        if (!mgrInfo) return;

        for (var achvType in mgrInfo){
            var achv = <Achievement>Utils.filter(AchievementMgr.mgr.allAchvs, (achv:Achievement) => achv.type == achvType)[0];
            Utils.assert(!!achv, "no such achievement, type: " + achvType);
            // Utils.assert(achv.achvClass() == "singleGame", "this achievement don't need save and load, type: " + achv.type);
            if (achv.achvClass() == "singleGame")
                for (var toStringField in mgrInfo[achvType])
                    achv[toStringField] = mgrInfo[achvType][toStringField];
            
        }
    }
}