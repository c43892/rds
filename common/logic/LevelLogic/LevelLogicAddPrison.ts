class LevelLogicAddPrison extends LevelLogic {
    constructor() {
        super("LevelLogicAddPrison");

        this.addAI("onLevelInitElems", (ps) => {
            // 随机是否出现监狱
            var rateInfo = GCfg.getMiscConfig("prisonRate");
            var levelIndex = Number(this.level.bt.player.difficulty.substr(5));
            var rate = rateInfo[this.level.levelType][levelIndex];
            rate = 10000;  // 测试用,要删的
            if (this.level.bt.srand.nextInt(0, 10000) >= rate || Utils.getLockedOccupations().length == 0)
                return;

            var prison = this.level.createElem("Prison");
            ps.elems.push(prison);
        }, true);
    }
}