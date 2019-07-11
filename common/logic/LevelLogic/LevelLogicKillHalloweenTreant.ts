// 专用于第一次击败树妖的剧情对话
class LevelLogicKillHalloweenTreant extends LevelLogic {
    constructor() {
        super("LevelLogicKillHalloweenTreant");
        this.addAI("onElemChanged", async (ps) => {
            if (ps.subType != "dead" || ps.e.type != "HalloweenTreant")
                return;

            var bt = this.level.bt;
            if (bt.player.difficulty == "level2" && Utils.getDiffByAchvData() == 3 && !Utils.loadLocalData("killHalloweenTreantFirstTimeFinished")) {
                // 必定触发一次密室
                var prison = bt.level.createElem("Prison");
                var g = BattleUtils.findRandomEmptyGrid(bt, false);
                if (g) {
                    await bt.fireEvent("killHalloweenTreantFirstTimeFinished", ps);
                    await bt.implAddElemAt(prison, g.pos.x, g.pos.y);
                    // 存一下标记
                    Utils.saveLocalData("killHalloweenTreantFirstTimeFinished", true);
                    // // 测试用删除标记
                    // Utils.removeLocalData("killHalloweenTreantFirstTimeFinished");
                }
            }
        });
    }
}