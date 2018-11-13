class LevelLogicBoss extends LevelLogic {
    private bossType;
    private valid = true;
    constructor(bossType:string){
        super("LevelLogicBoss");

        this.bossType = bossType;

        // 创建关卡时添加boss
        this.addAI("onLevelInitElems", (ps) => {            
            var e = this.level.createElem(bossType);
            ps.elems.push(e);            
        }, true)

        // boss被消灭后添加豪华宝箱
        this.addAI("onElemChanged", async (ps) => {
            if (ps.subType != "dead" || !this.valid) return;

            var bt = this.level.bt;
            var ms = this.level.map.findAllElems((e:Elem) => e instanceof Monster && e.isHazard() && e.type != "PlaceHolder");
            if (ms.length == 0) {
                this.valid = false;
                var g = BattleUtils.findRandomEmptyGrid(this.level.bt, false);
                if (g){
                    await bt.fireEvent("onGetMarkAllAward");
                    var luxuryChest = this.level.createElem("LuxuryChest");
                    await bt.implAddElemAt(luxuryChest, g.pos.x, g.pos.y);
                    await bt.triggerLogicPoint("onGetMarkAllAward");
                }
            }
        })
    }
}