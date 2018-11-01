// 专门用于在揭开起始区域后增加商人
class LevelLogicAddShopNpc extends LevelLogic {
    constructor (){
        super("LevelLogicAddShopNpc");

        this.addAI("onStartupRegionUncoveredAddShopNpc", async (ps) => {
            var shopNpc = this.level.createElem("ShopNpc");
            await this.level.bt.implAddElem2Area(shopNpc, ps.ep.pos, ps.ep.attrs.size);
        })
    }
}