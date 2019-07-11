class LevelLogicAddPrison extends LevelLogic {
    constructor() {
        super("LevelLogicAddPrison");

        this.addAI("onLevelInitElems", (ps) => {
            // 难度检查,只有最后两个难度会出现监狱
            if(this.level.bt.player.difficulty != "level3" && this.level.bt.player.difficulty != "level4")
                return;
                
            // 随机是否出现监狱,只有前3个难度才会出现
            var levelType = this.level.levelType;
            var rateInfo = GCfg.getMiscConfig("prisonRate");
            var levelIndex = Number(this.level.bt.player.difficulty.substr(5));
            var rate;
            if (levelType == "normal")
                rate = rateInfo["normal"][levelIndex];
            else if (Utils.indexOf(GCfg.getMiscConfig("seniorTypes"), (t) => t == levelType) > -1)
                rate = rateInfo["senior"][levelIndex];
            else if (Utils.indexOf(GCfg.getMiscConfig("bossTypes"), (t) => t == levelType) > -1)
                rate = rateInfo["boss"][levelIndex];
            else return;

            if (this.level.bt.srand.nextInt(0, 10000) >= rate || Utils.getLockedOccupations().length == 0)
                return;

            var prison = this.level.createElem("Prison");
            ps.elems.push(prison);
        }, true);
    }
}