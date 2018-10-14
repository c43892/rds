class LevelLogicSearchBody extends LevelLogic{
    public rdps;
    constructor(rdps){
        super("LevelLogicSearchBody");
        this.rdps = rdps;

        this.addAI("beforeLevelInited", async (ps) => {
            var bt = this.level.bt;
            for(var i = 0; i < rdps.length; i++){
                if(isNaN(rdps[i]))
                    var box = this.level.createElem("TreasureBox", {rdp:rdps[i]});
                else{
                    var box = this.level.createElem("TreasureBox");
                    var coins = this.level.createElem("Coins", {cnt:rdps[i]})
                    box.addDropItem(coins);
                }
                var key = this.level.createElem("Key");
                var gs = BattleUtils.findRandomGrids(bt, (g:Grid) => !g.getElem() && !g.isCovered(), 2);
                if(gs.length == 2){
                    await bt.implAddElemAt(box, gs[0].pos.x, gs[0].pos.y);
                    await bt.implAddElemAt(key, gs[1].pos.x, gs[1].pos.y);
                }
            }
        })
    }
}