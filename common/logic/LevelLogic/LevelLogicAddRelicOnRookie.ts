class LevelLogicAddRelicOnRookie extends LevelLogic {
    constructor() {
        super("LevelLogicAddRelicOnRookie");

        this.addAI("beforeLevelInited2", async (ps) => {
            var bt:Battle = ps.bt;
            var r = <Relic>ElemFactory.create("HorticultureMaster");
            bt.player.addItem(r);
            await bt.fireEvent("onRelicChanged", {subType:"addRelicByRookie", e:r});
        })
    }
}