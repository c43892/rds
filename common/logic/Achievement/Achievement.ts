class Achievement {
    public mgr:AchievementMgr
    public type;
    public cfg;
    public stages():number {
        return this.cfg.stages ? this.cfg.stages.length : 0
    };
    public achvClass = () => this.cfg.achvClass;
    public activated;
    public refresh;
    public refreshFields = [];
    public toStringFields = [];
    
    // 是否被完成,包括预完成
    public isFinished(){
        // 查找本地存档的信息,是否在之前的游戏过程已经完成
        if (Utils.loadAchvData(this.type) && Utils.loadAchvData(this.type) == "finished")
            return true;
        else 
            // 是否在管理器中被预完成
            for (var preFinishedAcv of this.mgr.allPreFinishedAchvs())
                if (preFinishedAcv.type == this.type && preFinishedAcv.isFinished)
                    return true;
            
        return false;
    }
    
    // 完成到的阶段
    public finishedStage() {
        // 如果已经完成过或者预完成
        if (this.isFinished())
            return -1;
        
        var finishedStage = 0;
        var inPre = false;
        // 存在潜在的递进关系, 先查看管理器,会比存档中的更新
        for (var preFinishedAcv of this.mgr.allPreFinishedAchvs())
            if (preFinishedAcv.type == this.type){
                inPre = true;
                if (preFinishedAcv.finishedStage && preFinishedAcv.finishedStage > finishedStage)
                    finishedStage = preFinishedAcv.finishedStage;
            }
        
        if (!inPre && Utils.loadAchvData(this.type))
            finishedStage = Utils.loadAchvData(this.type);

        return finishedStage;
    }

    // 获取成就的完成进度信息
    public finishedProgressInfo():string {
        if(this.cfg.multiAchv){

        }
        else if (this.cfg.conditions){

        }
        else {
            if (this.isFinished())
                return "已完成";
            else 
                return "0 / 1";
        }
    }
}
